"""Restore one legacy backup into an isolated temporary SQL Server and export metadata only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import time
import zipfile

from audit_legacy_backup import read_entry

HOST = "npipe:////./pipe/docker_engine"
NAME = "gishow-legacy-audit-5450"
DATABASE = "GishowLegacyAudit5450"
LABEL = "gishow.audit.owner=worktree-5450"


def docker(*args, env=None, check=True):
    result = subprocess.run(["docker", "-H", HOST, *args], env=env,
                            capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and result.returncode:
        # Do not echo launch arguments, environment or credentials.
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup_zip", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--profile-output", type=Path, help="Export aggregate integrity and format checks only")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    local = root / ".local-audit"
    local.mkdir(exist_ok=True)
    backup = local / "legacy-database.bak"
    with zipfile.ZipFile(args.backup_zip) as archive:
        entries = [e for e in archive.infolist() if not e.is_dir()]
        if len(entries) != 1:
            raise ValueError("Expected exactly one database backup entry")
        data = read_entry(archive, entries[0])
    if not data.startswith(b"TAPE"):
        raise ValueError("Unexpected backup signature")
    backup.write_bytes(data)
    password = "Ga!" + secrets.token_urlsafe(32) + "9a"
    env = dict(os.environ, MSSQL_SA_PASSWORD=password, SQLCMDPASSWORD=password)
    exists = docker("inspect", NAME, check=False)
    if exists.returncode == 0:
        raise RuntimeError("Audit container already exists; refusing to reuse or overwrite it")
    created = False
    try:
        docker("run", "-d", "--name", NAME, "--label", LABEL, "--network", "none",
               "--memory", "3g", "--cpus", "2", "-e", "ACCEPT_EULA=Y",
               "-e", "MSSQL_PID=Developer", "-e", "MSSQL_SA_PASSWORD",
               "mcr.microsoft.com/mssql/server:2022-latest", env=env)
        created = True
        client = "/opt/mssql-tools18/bin/sqlcmd"

        def sql(query, json_result=False, check=True):
            options = ["-y", "0", "-w", "65535"] if json_result else ["-h", "-1", "-W", "-s", "|"]
            return docker("exec", "-e", "SQLCMDPASSWORD", NAME, client,
                          "-S", "tcp:127.0.0.1,1433", "-U", "sa", "-C", "-b", "-r", "1", "-l", "5",
                          *options, "-Q", "SET NOCOUNT ON; " + query,
                          env=env, check=check)

        for _ in range(24):
            probe = sql("SELECT 1", check=False)
            if probe.returncode == 0:
                break
            time.sleep(2)
        else:
            raise RuntimeError("Temporary SQL Server did not become ready: " + probe.stderr.strip())
        docker("cp", str(backup), NAME + ":/tmp/legacy-database.bak")
        header = sql("RESTORE HEADERONLY FROM DISK='/tmp/legacy-database.bak'").stdout
        header_rows = [[p.strip() for p in line.split("|")] for line in header.splitlines() if "|" in line]
        if len(header_rows) != 1 or len(header_rows[0]) < 28 or header_rows[0][2] != "1":
            raise RuntimeError("Expected exactly one full database backup")
        header_fields = header_rows[0]
        sql("RESTORE VERIFYONLY FROM DISK='/tmp/legacy-database.bak'")
        listing = sql("RESTORE FILELISTONLY FROM DISK='/tmp/legacy-database.bak'").stdout
        moves = []
        file_metadata = []
        for line in listing.splitlines():
            parts = [p.strip() for p in line.split("|")]
            if len(parts) < 4 or parts[2] not in ("D", "L"):
                continue
            logical, file_type = parts[0], parts[2]
            index = len(moves)
            suffix = "ldf" if file_type == "L" else "mdf"
            target = f"/var/opt/mssql/data/gishow_audit_{index}.{suffix}"
            moves.append("MOVE N'" + logical.replace("'", "''") + "' TO N'" + target + "'")
            file_metadata.append({"logical_name": logical, "type": file_type})
        if not moves:
            raise RuntimeError("No database files found in backup")
        print("Restoring backup into temporary isolated database...", flush=True)
        sql(f"RESTORE DATABASE [{DATABASE}] FROM DISK='/tmp/legacy-database.bak' WITH " + ", ".join(moves))
        sql(f"ALTER DATABASE [{DATABASE}] SET READ_ONLY WITH NO_WAIT")
        queries = {
            "tables": "SELECT s.name AS schema_name,t.name AS table_name,COALESCE(SUM(p.rows),0) AS row_count FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id LEFT JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY s.name,t.name ORDER BY s.name,t.name",
            "columns": "SELECT s.name AS schema_name,t.name AS table_name,c.column_id,c.name AS column_name,ty.name AS data_type,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id ORDER BY s.name,t.name,c.column_id",
            "foreign_keys": "SELECT fk.name AS constraint_name,OBJECT_NAME(fk.parent_object_id) AS from_table,pc.name AS from_column,OBJECT_NAME(fk.referenced_object_id) AS to_table,rc.name AS to_column,fk.delete_referential_action_desc AS on_delete FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=fk.object_id JOIN sys.columns pc ON pc.object_id=fc.parent_object_id AND pc.column_id=fc.parent_column_id JOIN sys.columns rc ON rc.object_id=fc.referenced_object_id AND rc.column_id=fc.referenced_column_id ORDER BY fk.name,fc.constraint_column_id",
            "indexes": "SELECT t.name AS table_name,i.name AS index_name,i.is_unique,i.is_primary_key,c.name AS column_name,ic.key_ordinal,ic.is_included_column FROM sys.tables t JOIN sys.indexes i ON i.object_id=t.object_id JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.name IS NOT NULL ORDER BY t.name,i.name,ic.index_column_id",
            "database": "SELECT name,compatibility_level,is_read_only FROM sys.databases WHERE name=DB_NAME()",
        }
        report = {"backup_sha256": hashlib.sha256(data).hexdigest(), "restored": True,
                  "metadata_only": True, "files": file_metadata,
                  "backup_header_field_count": len(header_fields),
                  "backup_database_name": header_fields[9],
                  "backup_started_at": header_fields[17],
                  "backup_finished_at": header_fields[18],
                  "backup_source_engine_major": header_fields[25],
                  "backup_verified": True,
                  "engine_version": sql("SELECT CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(100))").stdout.strip()}
        for key, query in queries.items():
            result = sql(f"USE [{DATABASE}]; {query} FOR JSON PATH", json_result=True)
            lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
            lines = [line for line in lines if not line.startswith("JSON_") and set(line) != {"-"}]
            report[key] = json.loads("".join(lines))
        if args.profile_output:
            from legacy_profile_queries import build_queries
            profile = {"backup_sha256": report["backup_sha256"], "aggregate_only": True,
                       "database_read_only": report["database"][0]["is_read_only"], "checks": {}}
            for key, query in build_queries(report).items():
                result = sql(f"USE [{DATABASE}]; {query} FOR JSON PATH", json_result=True)
                lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
                lines = [line for line in lines if not line.startswith("JSON_") and set(line) != {"-"}]
                profile["checks"][key] = json.loads("".join(lines))
            # Read asset names privately in memory; export aggregate matching counts only.
            from collections import Counter
            import re
            hosting_archive = args.backup_zip.parents[2] / "backup_user-data_2501200621.zip"
            with zipfile.ZipFile(hosting_archive) as archive:
                basenames = Counter(e.filename.replace("\\", "/").rsplit("/", 1)[-1].casefold()
                                    for e in archive.infolist() if not e.is_dir() and e.filename.startswith("httpdocs/"))
            assets = []
            for table, column in [("ImageBarnames", "ImageName"), ("ImagesMadareks", "ImageName"),
                                  ("Actresses", "Image"), ("Salons", "PlanImageName"),
                                  ("SlideShows", "ImageName"), ("UserLists", "Image"),
                                  ("ChairInBarnames", "ImageBarCodeName")]:
                result = sql(f"USE [{DATABASE}]; SELECT [{column}] AS asset_name FROM dbo.[{table}] WHERE [{column}] IS NOT NULL AND [{column}]<>'' FOR JSON PATH", json_result=True)
                lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
                lines = [line for line in lines if not line.startswith("JSON_") and set(line) != {"-"}]
                names = [re.split(r"[/\\]", row["asset_name"])[-1].casefold()
                         for row in json.loads("".join(lines) or "[]")]
                assets.append({"source": table + "." + column, "references": len(names),
                               "basename_found": sum(basenames[n] > 0 for n in names),
                               "basename_not_found": sum(basenames[n] == 0 for n in names),
                               "ambiguous_basename": sum(basenames[n] > 1 for n in names),
                               "note": "Basename match is preliminary; full-path and file-content validation remain."})
            profile["checks"]["asset_reference_inventory"] = assets
            args.profile_output.parent.mkdir(parents=True, exist_ok=True)
            args.profile_output.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"Exported {len(profile['checks'])} aggregate checks.", flush=True)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Exported metadata for {len(report['tables'])} tables and {len(report['columns'])} columns.", flush=True)
    finally:
        if created:
            info = json.loads(docker("inspect", NAME).stdout)[0]
            if info["Config"].get("Labels", {}).get("gishow.audit.owner") != "worktree-5450":
                raise RuntimeError("Container ownership label mismatch; refusing cleanup")
            docker("rm", "-f", NAME)


if __name__ == "__main__":
    main()
