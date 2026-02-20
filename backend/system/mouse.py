"""
Mouse control module using pyautogui.
Provides relative movement, clicks, and scrolling.
"""
import pyautogui

# Disable failsafe (moving to corner won't abort) for smoother control
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0  # No artificial delay between actions


def move_mouse(dx: float, dy: float) -> None:
    """Move mouse by relative (dx, dy) pixels."""
    pyautogui.moveRel(dx, dy, duration=0)


def left_click() -> None:
    pyautogui.click(button="left")


def right_click() -> None:
    pyautogui.click(button="right")


def double_click() -> None:
    pyautogui.doubleClick(button="left")


def scroll(dy: int) -> None:
    """Scroll vertically. Positive = up, negative = down."""
    pyautogui.scroll(dy)
