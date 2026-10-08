"""Verify explicit schema upgrades without touching real databases."""
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]

def run_python(code, env):
    return subprocess.run([sys.executable, "-c", code], cwd=ROOT, env=env,
                          capture_output=True, text=True, check=True)

def test_import_does_not_create_database(tmp_path):
    database = tmp_path / "untouched.db"
    env = dict(os.environ, DATABASE_URL=f"sqlite:///{database.as_posix()}")
    run_python("import backend.main", env)
    assert not database.exists()

def test_migration_and_readiness(tmp_path):
    database = tmp_path / "fresh.db"
    env = dict(os.environ, DATABASE_URL=f"sqlite:///{database.as_posix()}")
    run_python("from fastapi.testclient import TestClient; from backend.main import app; assert TestClient(app).get('/api/health').status_code == 503", env)
    command = [sys.executable, "-m", "alembic", "-c", "backend/alembic.ini", "upgrade", "head"]
    for _ in range(2):
        subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, check=True)
    run_python("from fastapi.testclient import TestClient; from backend.main import app; from backend.database import SessionLocal; from backend.models import Salon; assert TestClient(app).get('/api/health').status_code == 200; db=SessionLocal(); assert db.query(Salon).count() == 0; db.close()", env)
