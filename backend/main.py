from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
import os
from .database import get_db
from .routers import events, seats, checkout, checker, admin, auth, access, catalog

app = FastAPI(title="سامانه فروش بلیت گیشو", version="2.0.0")
origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173").split(",") if value.strip()]
if "*" in origins:
    raise ValueError("Explicit CORS origins are required for account sessions")
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "DELETE"],
                   allow_headers=["Content-Type", "Authorization", "X-Gishow-Request"])
for router in (events.router, seats.router, checkout.router, checker.router, admin.router, auth.router, access.router):
    app.include_router(router, prefix="/api")
app.include_router(catalog.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "online", "service": "Gishow", "version": "2.0.0"}

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        version = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
        if version != "0003_catalog":
            raise ValueError("Schema migration required")
    except Exception:
        raise HTTPException(status_code=503, detail="پایگاه داده آماده نیست؛ اتصال و تغییرات ساختار بررسی شود.")
    return {"status": "ready", "schema_version": version}

@app.middleware("http")
async def private_responses(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/api/auth", "/api/admin", "/api/access", "/api/checker", "/api/catalog/run-turns")):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
