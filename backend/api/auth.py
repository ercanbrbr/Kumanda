"""
Optional PIN-based authentication middleware.

Reads the live PIN from app_state at request time — so PIN changes made
via the tray menu take effect immediately without a server restart.

If PIN is None (empty), auth is disabled entirely.
If server_active is False, all API requests receive a 503.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from state import app_state

_UNAUTHORIZED = JSONResponse(
    {"detail": "Invalid or missing PIN. Set X-PIN header."},
    status_code=401,
)

_SERVICE_UNAVAILABLE = JSONResponse(
    {"detail": "Server is currently inactive."},
    status_code=503,
)


class PinAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Static assets / SPA root — always allowed
        if path == "/" or path.startswith("/assets"):
            return await call_next(request)

        # Server toggle: reject all API traffic when inactive
        if not app_state.server_active:
            return _SERVICE_UNAVAILABLE

        # WebSocket PIN auth is handled inside each WS handler
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # PIN not configured → allow everything
        if app_state.pin is None:
            return await call_next(request)

        # Check PIN header
        provided = request.headers.get("X-PIN")
        if provided != app_state.pin:
            return JSONResponse(
                {"detail": "Invalid or missing PIN. Set X-PIN header."},
                status_code=401,
            )

        return await call_next(request)


def verify_ws_pin(pin_param: str | None) -> bool:
    """Call this inside WebSocket handlers to verify the PIN query param."""
    if app_state.pin is None:
        return True
    return pin_param == app_state.pin
