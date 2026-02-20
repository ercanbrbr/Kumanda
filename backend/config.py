import os
from dotenv import load_dotenv

load_dotenv()

PIN: str | None = os.getenv("PIN") or None  # None means auth disabled
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
