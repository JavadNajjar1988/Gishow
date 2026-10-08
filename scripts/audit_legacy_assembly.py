"""Export model and controller names from the legacy assembly; no values or method bodies."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

from audit_legacy_backup import read_entry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    import dnfile
    with zipfile.ZipFile(args.archive) as archive:
        entry = archive.getinfo("httpdocs/bin/EasyTicket_Site.dll")
        data = read_entry(archive, entry)
    pe = dnfile.dnPE(data=data)
    controllers, models = [], []
    for item in pe.net.mdtables.TypeDef.rows:
        name, namespace = str(item.TypeName), str(item.TypeNamespace)
        if not namespace.startswith("EasyTicket_Site"):
            continue
        methods = sorted({str(index.row.Name) for index in item.MethodList})
        if name.endswith("Controller"):
            controllers.append({"namespace": namespace, "type": name,
                                "methods": [m for m in methods if not m.startswith((".", "get_", "set_"))]})
        elif ".Models" in namespace and not name.startswith("<"):
            properties = sorted({m[4:] for m in methods if m.startswith("get_")})
            if properties:
                models.append({"namespace": namespace, "type": name, "properties": properties})
    result = {"assembly_entry": entry.filename, "sha256": hashlib.sha256(data).hexdigest(),
              "controllers": controllers, "models": models,
              "limitations": ["Method names do not prove routes, authorization or runtime behavior.",
                              "Properties are inferred from getter names; database schema is separate.",
                              "No method bodies, configuration values or customer data exported."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Inventoried {len(controllers)} controller types and {len(models)} model types.")


if __name__ == "__main__":
    main()
