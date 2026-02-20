# 📱 Kumanda

A local network PC controller app — control your computer from your phone's browser.

> 🤖 Entirely built with **vibe coding** using AI assistance.

## Features

- 🔊 Audio volume control
- 🔆 Display brightness control
- 🖱️ Phone as a wireless mousepad
- ⏯️ Media playback controls (play, pause, next, previous)
- 🌐 Mobile-first web UI, no app install needed

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, Uvicorn |
| System | pycaw, screen-brightness-control, pyautogui |
| Frontend | React 19, Vite, React Router |

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the displayed local IP address on your phone (same Wi-Fi network required).

## License

MIT © 2026
