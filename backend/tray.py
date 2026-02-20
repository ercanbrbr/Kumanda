"""
tray.py — Kumanda entry point for production / EXE use.

Starts the FastAPI/uvicorn server in a background thread, then hands
the main thread to pystray to manage the Windows system-tray icon.

Right-click menu:
  • Set PIN…       → tkinter input dialog, updates live PIN, kicks clients
  • Server: ON/OFF → toggles app_state.server_active
  • ──────────────
  • Exit            → shuts down server and exits cleanly
"""
import sys
import threading
import tkinter as tk
import tkinter.simpledialog as sd
import tkinter.messagebox as mb

import uvicorn
from PIL import Image, ImageDraw
import pystray

# Bootstrap: make sure imports resolve when run as EXE or from backend/
import os
sys.path.insert(0, os.path.dirname(__file__))

from config import HOST, PORT, PIN as CONFIG_PIN
from state import app_state


# ── Icon generation ───────────────────────────────────────────────────────────

def _make_icon_image(size: int = 64) -> Image.Image:
    """
    Draw a simple remote-control / wireless icon in memory.
    No external image file required.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size

    # Dark rounded background
    d.ellipse([2, 2, s - 2, s - 2], fill=(30, 30, 40, 255))

    # Signal arcs (white)
    arc_color = (200, 200, 255, 220)
    for r in [10, 18, 26]:
        x0 = s // 2 - r
        y0 = s // 2 - r
        x1 = s // 2 + r
        y1 = s // 2 + r
        d.arc([x0, y0, x1, y1], start=210, end=330, fill=arc_color, width=3)

    # Center dot
    c = s // 2
    d.ellipse([c - 4, c - 4, c + 4, c + 4], fill=(255, 255, 255, 255))

    return img


# ── Uvicorn server thread ─────────────────────────────────────────────────────

_uvicorn_server: uvicorn.Server | None = None


def _start_server():
    global _uvicorn_server
    config = uvicorn.Config(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="warning",   # quieter in tray mode
    )
    _uvicorn_server = uvicorn.Server(config)
    _uvicorn_server.run()


def _stop_server():
    if _uvicorn_server:
        _uvicorn_server.should_exit = True


# ── Tray action helpers ───────────────────────────────────────────────────────

def _set_pin(icon: pystray.Icon, item):
    """Open a tkinter dialog to change the PIN."""
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    current = f"Current PIN: {app_state.pin}" if app_state.pin else "Auth is currently disabled (no PIN)"
    new_pin = sd.askstring(
        "Kumanda – Set PIN",
        f"{current}\n\nEnter new PIN (leave empty to disable auth):",
        parent=root,
    )
    root.destroy()

    if new_pin is None:
        return  # user cancelled

    app_state.set_pin(new_pin)

    if app_state.pin:
        msg = f"PIN set to: {app_state.pin}\nAll connected devices have been disconnected."
    else:
        msg = "PIN removed. Auth is now disabled."

    _show_info("Kumanda – PIN Updated", msg)


def _toggle_server(icon: pystray.Icon, item):
    app_state.server_active = not app_state.server_active
    icon.update_menu()


def _exit_app(icon: pystray.Icon, item):
    app_state.kick_all_ws_sync()
    _stop_server()
    icon.stop()


def _show_info(title: str, msg: str):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    mb.showinfo(title, msg, parent=root)
    root.destroy()


# ── Menu builder ──────────────────────────────────────────────────────────────

def _build_menu() -> pystray.Menu:
    def server_label(item):
        return "Server: ON ✓" if app_state.server_active else "Server: OFF ✗"

    return pystray.Menu(
        pystray.MenuItem("Kumanda", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Set PIN…", _set_pin),
        pystray.MenuItem(server_label, _toggle_server),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Exit", _exit_app),
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Initialise live PIN from .env / config
    app_state.pin = CONFIG_PIN
    app_state.server_active = True

    # Start uvicorn in background thread
    server_thread = threading.Thread(target=_start_server, daemon=True)
    server_thread.start()

    # Build and run tray icon (blocks the main thread — required on Windows)
    icon = pystray.Icon(
        name="kumanda",
        icon=_make_icon_image(),
        title="Kumanda – PC Remote Controller",
        menu=_build_menu(),
    )
    icon.run()


if __name__ == "__main__":
    main()
