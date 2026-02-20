"""
Display brightness control using screen-brightness-control.
Works with most monitors on Windows (DDC/CI and WMI).
Falls back gracefully if no compatible monitor is found.
"""
import screen_brightness_control as sbc


def get_brightness() -> int:
    """Return current brightness as 0-100. Returns -1 on failure."""
    try:
        levels = sbc.get_brightness()
        if levels:
            return levels[0]
    except Exception:
        pass
    return -1


def set_brightness(level: int) -> bool:
    """Set brightness 0-100. Returns True on success."""
    level = max(0, min(100, level))
    try:
        sbc.set_brightness(level)
        return True
    except Exception:
        return False
