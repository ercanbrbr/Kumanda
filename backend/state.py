"""
AppState — shared singleton for runtime configuration.

Holds the live PIN and the set of currently connected WebSocket clients.
The tray menu reads/writes this object; auth middleware reads from it on
every request so changes take effect immediately without a server restart.
"""
import asyncio
from typing import Optional


class AppState:
    def __init__(self):
        self.pin: Optional[str] = None          # None = auth disabled
        self.server_active: bool = True          # False → 503 for all API calls
        self._ws_clients: set = set()            # open WebSocket objects

    # ── WebSocket registry ──────────────────────────────────────────────────

    def register_ws(self, ws) -> None:
        self._ws_clients.add(ws)

    def unregister_ws(self, ws) -> None:
        self._ws_clients.discard(ws)

    # ── PIN management ──────────────────────────────────────────────────────

    def set_pin(self, new_pin: Optional[str]) -> None:
        """
        Update the live PIN.  Empty string → disable auth (None).
        Kicks all connected WebSocket clients so they must re-authenticate.
        """
        self.pin = new_pin.strip() if new_pin and new_pin.strip() else None
        self._kick_all()

    def kick_all_ws_sync(self) -> None:
        """Synchronous kick for use from non-async contexts (e.g. tray Exit)."""
        self._kick_all()

    def _kick_all(self) -> None:
        """Schedule close() on every connected WebSocket from any thread."""
        clients = list(self._ws_clients)
        if not clients:
            return

        async def _close_all():
            for ws in clients:
                try:
                    await ws.close(code=4401)
                except Exception:
                    pass

        # If there's a running event loop, schedule the coroutine on it.
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(_close_all())
            else:
                loop.run_until_complete(_close_all())
        except Exception:
            pass


# Module-level singleton — import this everywhere
app_state = AppState()
