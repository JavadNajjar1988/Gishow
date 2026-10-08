"""Inventory legacy views without extracting private hosting files or restoring data."""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import struct
import zipfile
import zlib


MAPPING = {
    "Actresses": "src/components/AdminDashboard.tsx",
    "AdminPartialView": "src/components/Header.tsx",
    "AdminSettingSite": "src/components/AdminDashboard.tsx",
    "AdminSite": "src/components/AdminDashboard.tsx",
    "BankTerminals": "src/components/AdminDashboard.tsx",
    "Barname": "src/components/AdminDashboard.tsx",
    "ChairForBarname": "src/components/AdminDashboard.tsx",
    "ChairInParts": "src/components/SalonPlanBuilderModal.tsx",
    "FactorLists": "src/components/AdminDashboard.tsx",
    "ImageBarnames": None,
    "ImagesMadareks": "src/components/AdminDashboard.tsx",
    "MaliManagment": "src/components/AdminDashboard.tsx",
    "MarkdownLists": "src/components/AdminDashboard.tsx",
    "PartOfSalons": "src/components/SalonPlanBuilderModal.tsx",
    "RunTurns": "src/components/AdminDashboard.tsx",
    "Salons": "src/components/AdminDashboard.tsx",
    "SlideShow": None,
    "UserLists": "src/components/AdminDashboard.tsx",
    "TransitionProgram": "src/components/ProducerDashboard.tsx",
    "TicketChecker": "src/components/TicketChecker.tsx",
    "Account": None,
    "Purchase": None,
    "More": "src/components/InfoModal.tsx",
    "Home": "src/App.tsx",
    "Installation": None,
    "Shared": None,
    "PartialView": "src/App.tsx",
    "EditorTemplates": None,
}


def read_entry(archive: zipfile.ZipFile, entry: zipfile.ZipInfo) -> bytes:
    if entry.compress_type != 93:
        return archive.read(entry)
    # Older Python releases cannot read ZIP method 93; decompress only selected entries.
    import zstandard
    with open(archive.filename, "rb") as stream:
        stream.seek(entry.header_offset)
        header = stream.read(30)
        if header[:4] != b"PK\x03\x04":
            raise ValueError("Invalid ZIP local header")
        name_size, extra_size = struct.unpack_from("<HH", header, 26)
        stream.seek(name_size + extra_size, 1)
        compressed = stream.read(entry.compress_size)
    data = zstandard.ZstdDecompressor().decompress(compressed, max_output_size=entry.file_size)
    if len(data) != entry.file_size or zlib.crc32(data) != entry.CRC:
        raise ValueError("ZIP entry size or CRC mismatch")
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    views = []
    with zipfile.ZipFile(args.backup / "backup_user-data_2501200621.zip") as archive:
        entry_count = len(archive.infolist())
        source_projects = [e.filename for e in archive.infolist() if e.filename.endswith((".sln", ".csproj"))]
        for entry in archive.infolist():
            name = entry.filename
            if not name.startswith(("httpdocs/", "checker.gishow.ir/")) or not name.endswith(".cshtml"):
                continue
            raw = read_entry(archive, entry)
            text = raw.decode("utf-8-sig", errors="replace")
            parts = name.split("/")
            section = parts[-2]
            target = MAPPING.get(section)
            if "TransitionProgram" in parts and section not in ("Shared",):
                target = "src/components/ProducerDashboard.tsx"
            fields = sorted(set(re.findall(r"\bmodel\s*=>\s*model\.(\w+)|\bModel\.(\w+)", text)))
            routes = sorted(set(re.findall(r"url\s*:\s*['\"](/[^'\"]+)['\"]", text)))
            views.append({
                "legacy_view": name,
                "section": section,
                "sha256": hashlib.sha256(raw).hexdigest(),
                "current_candidate": target,
                "candidate_exists": bool(target and (repo / target).is_file()),
                "mapping_status": "candidate_only" if target else "manual_review_required",
                "model_fields": sorted({a or b for a, b in fields}),
                "ajax_routes": routes,
            })
    current_models = []
    tree = ast.parse((repo / "backend/models.py").read_text(encoding="utf-8-sig"))
    for node in tree.body:
        if not isinstance(node, ast.ClassDef):
            continue
        columns = []
        table = None
        for item in node.body:
            if isinstance(item, ast.Assign) and isinstance(item.targets[0], ast.Name):
                key = item.targets[0].id
                if key == "__tablename__":
                    table = ast.literal_eval(item.value)
                elif isinstance(item.value, ast.Call) and isinstance(item.value.func, ast.Name) and item.value.func.id == "Column":
                    columns.append(key)
        current_models.append({"model": node.name, "table": table, "columns": columns})
    database_archives = sorted((args.backup / "databases").rglob("*.zip"))
    databases = []
    for path in database_archives:
        with zipfile.ZipFile(path) as archive:
            for entry in archive.infolist():
                if entry.is_dir():
                    continue
                data = read_entry(archive, entry)
                databases.append({
                    "archive": path.relative_to(args.backup).as_posix(),
                    "entry": entry.filename,
                    "bytes": len(data),
                    "sha256": hashlib.sha256(data).hexdigest(),
                    "signature_hex": data[:16].hex(),
                    "sql_server_backup_signature": data.startswith(b"TAPE"),
                    "restored": False,
                    "schema_verified": False,
                })
    schema_path = args.output.parent / "legacy-database-schema.json"
    if schema_path.is_file():
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        for database in databases:
            if (schema.get("backup_sha256") == database["sha256"]
                    and schema.get("restored") and schema.get("backup_verified")
                    and schema.get("metadata_only")):
                database["restored"] = True
                database["schema_verified"] = True
                database["schema_report"] = schema_path.name
    report = {
        "scope": "source and deployed-view inspection; not runtime equivalence",
        "hosting_archive_entries": entry_count,
        "source_projects": source_projects,
        "view_count": len(views),
        "views": views,
        "current_models": current_models,
        "database_backups": databases,
        "limitations": [
            "Candidate mappings do not imply functional parity.",
            "Legacy controller source is not established by this inventory.",
            "Legacy column conversion and business semantics require further verification.",
            "No credentials, customer records or private hosting files are exported.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Inventoried {len(views)} views, {len(current_models)} current models and {len(databases)} database backups.")


if __name__ == "__main__":
    main()
