"""Export selected IL call names and allowlisted constants, never arbitrary embedded strings."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

from audit_legacy_backup import read_entry

METHODS = {"LoginUser", "RigesterUser", "GoToBank", "SaveFactorToBank", "MarkdownCode",
           "ShamsiDateTime", "ShamsiDate", "ResetChairStatus", "ResetChairStatusAdmin"}
SAFE_STRINGS = {"MD5", "SHA1", "SHA256", "yyyy/MM/dd", "yyyy/MM/dd HH:mm", "yyyyMMddHHmm",
                "yyyy", "MM", "dd", "HH", "mm", "0000", "00", "0", "/", ":", " ", "",
                "تومان", "ریال", "ReadyChair", "LockChair", "InterimLockChair",
                "SoldChair", "SoldVirtualChair", "DeleteChair"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    import dnfile
    from dncil.cil.body.reader import read_method_body_from_bytes
    with zipfile.ZipFile(args.archive) as archive:
        data = read_entry(archive, archive.getinfo("httpdocs/bin/EasyTicket_Site.dll"))
    pe = dnfile.dnPE(data=data)
    method_owners = {id(index.row): str(item.TypeNamespace) + "." + str(item.TypeName)
                     for item in pe.net.mdtables.TypeDef.rows for index in item.MethodList}

    def call_owner(instruction):
        token = getattr(instruction.operand, "value", None)
        if not token or token >> 24 not in (6, 10):
            return None
        table = pe.net.mdtables.MethodDef if token >> 24 == 6 else pe.net.mdtables.MemberRef
        row = table.rows[(token & 0xffffff) - 1]
        if token >> 24 == 6:
            return method_owners.get(id(row))
        owner = row.Class.row
        if hasattr(owner, "TypeName"):
            return str(owner.TypeNamespace) + "." + str(owner.TypeName)
        return None

    def call_name(instruction):
        token = getattr(instruction.operand, "value", None)
        if instruction.opcode.name not in ("call", "callvirt", "newobj") or not token:
            return None
        if token >> 24 not in (6, 10):
            return None
        table = pe.net.mdtables.MethodDef if token >> 24 == 6 else pe.net.mdtables.MemberRef
        return str(table.rows[(token & 0xffffff) - 1].Name)

    methods = []
    for item in pe.net.mdtables.TypeDef.rows:
        namespace = str(item.TypeNamespace)
        if not namespace.startswith("EasyTicket_Site"):
            continue
        for index in item.MethodList:
            method = index.row
            if str(method.Name) not in METHODS or not method.Rva:
                continue
            body = read_method_body_from_bytes(pe.get_data(method.Rva))
            events = []
            for pos, instruction in enumerate(body.instructions):
                name = call_name(instruction)
                if name:
                    events.append({"offset": instruction.offset, "kind": "call", "name": name,
                                   "owner": call_owner(instruction)})
                token = getattr(instruction.operand, "value", None)
                if instruction.opcode.name == "ldstr" and token:
                    value = pe.net.user_strings.get(token & 0xffffff).value
                    if value in SAFE_STRINGS:
                        event = {"offset": instruction.offset, "kind": "safe_literal", "value": value}
                        if value == "0":
                            context = []
                            for nearby in body.instructions[max(0, pos-8):pos+5]:
                                description = {"opcode": nearby.opcode.name}
                                name = call_name(nearby)
                                if name:
                                    description["call"] = name
                                context.append(description)
                            event["context"] = context
                        events.append(event)
                if instruction.opcode.name in ("mul", "div"):
                    context = []
                    for previous in body.instructions[max(0, pos-5):pos]:
                        description = {"opcode": previous.opcode.name}
                        name = call_name(previous)
                        if name:
                            description["call"] = name
                        elif previous.opcode.name.startswith("ldc.i4") and previous.operand in (0, 1, 2, 10, 100, 1000):
                            description["constant"] = previous.operand
                        context.append(description)
                    events.append({"offset": instruction.offset, "kind": "arithmetic",
                                   "opcode": instruction.opcode.name, "context": context})
            methods.append({"namespace": namespace, "type": str(item.TypeName),
                            "method": str(method.Name), "rva": method.Rva, "events": events})
    report = {"assembly_sha256": hashlib.sha256(data).hexdigest(), "methods": methods,
              "scope": "Selected IL metadata evidence; not a complete control-flow decompilation",
              "allowlisted_literals_only": True}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported selected evidence from {len(methods)} method bodies.")


if __name__ == "__main__":
    main()
