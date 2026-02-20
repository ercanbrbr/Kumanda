"""
Display API router – REST endpoints for brightness control.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from system import display

router = APIRouter(prefix="/api/display", tags=["display"])


class BrightnessRequest(BaseModel):
    level: int = Field(..., ge=0, le=100, description="Brightness level 0-100")


@router.get("/status")
def display_status():
    """Get current brightness level."""
    level = display.get_brightness()
    return {"brightness": level, "supported": level != -1}


@router.post("/brightness")
def set_brightness(req: BrightnessRequest):
    """Set brightness to a specific level (0-100)."""
    success = display.set_brightness(req.level)
    if not success:
        raise HTTPException(
            status_code=503,
            detail="Brightness control not supported on this monitor. Try adjusting manually.",
        )
    return {"brightness": req.level}
