"""
Mouse WebSocket router.
Phone connects via WebSocket and sends JSON events for cursor control.

Event formats:
  { "type": "move",   "dx": 5,   "dy": -3 }
  { "type": "click",  "button": "left" | "right" | "double" }
  { "type": "scroll", "dy": -3 }
"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from system import mouse
from state import app_state

router = APIRouter(tags=["mouse"])


@router.websocket("/ws/mouse")
async def mouse_websocket(ws: WebSocket):
    await ws.accept()
    app_state.register_ws(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")

            if event_type == "move":
                dx = float(event.get("dx", 0))
                dy = float(event.get("dy", 0))
                mouse.move_mouse(dx, dy)

            elif event_type == "click":
                button = event.get("button", "left")
                if button == "right":
                    mouse.right_click()
                elif button == "double":
                    mouse.double_click()
                else:
                    mouse.left_click()

            elif event_type == "scroll":
                dy = int(event.get("dy", 0))
                mouse.scroll(dy)

    except (WebSocketDisconnect, Exception):
        pass
    finally:
        app_state.unregister_ws(ws)
