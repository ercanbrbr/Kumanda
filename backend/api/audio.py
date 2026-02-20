"""
Audio API router – REST endpoints for volume, mute and media key control.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from system import audio
import pyautogui

router = APIRouter(prefix="/api/audio", tags=["audio"])


class VolumeRequest(BaseModel):
    level: int = Field(..., ge=0, le=100, description="Volume level 0-100")


@router.get("/status")
def audio_status():
    """Get current volume and mute state."""
    return {
        "volume": audio.get_volume(),
        "muted": audio.is_muted(),
    }


@router.post("/volume")
def set_volume(req: VolumeRequest):
    """Set volume to a specific level (0-100)."""
    audio.set_volume(req.level)
    return {"volume": req.level, "muted": audio.is_muted()}


@router.post("/mute")
def toggle_mute():
    """Toggle mute on/off."""
    new_state = audio.toggle_mute()
    return {"muted": new_state, "volume": audio.get_volume()}


# ── Media Keys ───────────────────────────────────────────────────────────────
@router.post("/media/playpause")
def media_play_pause():
    """Send play/pause media key."""
    pyautogui.press("playpause")
    return {"action": "playpause"}


@router.post("/media/next")
def media_next():
    """Send next track media key."""
    pyautogui.press("nexttrack")
    return {"action": "next"}


@router.post("/media/prev")
def media_prev():
    """Send previous track media key."""
    pyautogui.press("prevtrack")
    return {"action": "prev"}
