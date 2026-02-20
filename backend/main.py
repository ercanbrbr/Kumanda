"""
Kumanda - PC Remote Controller
FastAPI entry point.

Serves the React frontend as static files and exposes all API routes.
Run: python main.py
"""
import socket
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import HOST, PORT, PIN as CONFIG_PIN
from state import app_state
from api.auth import PinAuthMiddleware
from api import audio as audio_router
from api import display as display_router
from api import mouse as mouse_router


# ── Startup Banner ────────────────────────────────────────────────────────────
def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed live state from config (for direct `python main.py` usage)
    app_state.pin = CONFIG_PIN
    app_state.server_active = True

    ip = get_local_ip()
    sep = "=" * 50
    print(f"\n{sep}")
    print("  Kumanda - PC Remote Controller")
    print(sep)
    print(f"  Local:   http://localhost:{PORT}")
    print(f"  Network: http://{ip}:{PORT}  <- open this on your phone")
    print(f"  API:     http://localhost:{PORT}/docs")
    print(f"{sep}\n")
    yield  # app runs here


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Kumanda - PC Remote Controller",
    description="Control your PC audio, display, and mouse from your phone.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(PinAuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restricted to local network by OS firewall
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(audio_router.router)
app.include_router(display_router.router)
app.include_router(mouse_router.router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "kumanda"}


# ── Static Frontend ───────────────────────────────────────────────────────────
import os

# PyInstaller uses sys._MEIPASS to store bundled data
if getattr(sys, 'frozen', False):
    # Running as EXE
    BASE_DIR = Path(sys._MEIPASS)
    FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
else:
    # Running as script
    BASE_DIR = Path(__file__).parent.parent
    FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Catch-all: return index.html for client-side routing."""
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", include_in_schema=False)
    def no_frontend():
        return {
            "message": "Frontend not built yet. Run: cd frontend && npm install && npm run build",
            "api_docs": "/docs",
        }


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False, log_level="info")
