# 📱 Kumanda

Control your PC from your phone's browser. Simple, fast, and wireless.

> 🤖 Built with **vibe coding** using AI.

## ✨ Features

- 🔊 **Sound:** Adjust volume or mute.
- 🔆 **Brightness:** Change screen brightness.
- 🖱️ **Mouse:** Use your phone as a wireless touchpad.
- ⏯️ **Media:** Control music and videos (Play/Pause/Skip).
- 🌐 **No Apps:** Works in any mobile browser on your Wi-Fi.

---

## 🛠️ Setup (Simple 3 Steps)

### 1. Preparation
*   Install **Python 3.10 - 3.12 (Recommended)** and **Node.js**.
*   Connect your phone and PC to the **same Wi-Fi**.

### 2. Build & Run
Open your terminal and run these commands:
```bash
# Build the interface
cd frontend
npm install && npm run build

# Start the application
cd ../backend
pip install -r requirements.txt
python tray.py
```
*An icon will appear in the system tray. Right-click it to set a **PIN**.*

### 3. Connect
1. Enter the **Network URL** from the terminal (e.g., `http://192.168.1.50:8000`) into your phone's browser.
2. Enter your PIN and start controlling!

---

> [!TIP]
> **Connection Issue?** If the page doesn't open, make sure Windows Firewall allows Python to communicate.

## 📜 License
MIT © 2026
