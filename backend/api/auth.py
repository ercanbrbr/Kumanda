"""
Optional PIN-based authentication middleware.
If PIN is set in .env, every request must include header: X-PIN: <your-pin>
WebSocket connections must pass ?pin=<your-pin> as a query param.
Set PIN= (empty) to disable auth entirely.

NOTE: Do NOT raise HTTPException inside BaseHTTPMiddleware — Starlette converts
it to a 500. Return a JSONResponse directly instead.
"""
from fastapi import Request, WebSocket
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import PIN

_UNAUTHORIZED = JSONResponse(
    {"detail": "Invalid or missing PIN. Set X-PIN header."},
    status_code=401,
)


class PinAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # PIN not configured → allow everything
        if PIN is None:
            return await call_next(request)

        # Static file assets are always allowed (they carry no sensitive data)
        path = request.url.path
        if path == "/" or path.startswith("/assets"):
            return await call_next(request)

        # WebSocket auth is handled separately inside the WS handler
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Check PIN header
        provided = request.headers.get("X-PIN")
        if provided != PIN:
            return JSONResponse(
                {"detail": "Invalid or missing PIN. Set X-PIN header."},
                status_code=401,
            )

        return await call_next(request)


def verify_ws_pin(pin_param: str | None) -> bool:
    """Call this inside WebSocket handlers to verify the PIN query param."""
    if PIN is None:
        return True
    return pin_param == PIN
