"""
Audio control module using pycaw (Windows).
Controls system volume via the Windows Core Audio API.

NOTE: pycaw uses COM (Component Object Model). FastAPI runs endpoints in a
thread pool where COM is NOT automatically initialized. We call
comtypes.CoInitialize() at the start of every function to ensure COM is
ready on whichever thread the request lands on.
"""
import comtypes
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume


def _get_volume_interface() -> IAudioEndpointVolume:
    comtypes.CoInitialize()  # safe to call multiple times; reference-counted
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return cast(interface, POINTER(IAudioEndpointVolume))


def get_volume() -> int:
    """Return current system volume as 0-100 integer."""
    vol = _get_volume_interface()
    scalar = vol.GetMasterVolumeLevelScalar()
    return round(scalar * 100)


def set_volume(level: int) -> None:
    """Set system volume. level must be 0-100."""
    level = max(0, min(100, level))
    vol = _get_volume_interface()
    vol.SetMasterVolumeLevelScalar(level / 100.0, None)


def is_muted() -> bool:
    vol = _get_volume_interface()
    return bool(vol.GetMute())


def toggle_mute() -> bool:
    """Toggle mute state. Returns new mute state."""
    vol = _get_volume_interface()
    new_state = not bool(vol.GetMute())
    vol.SetMute(new_state, None)
    return new_state
