# Voice to Mem

Speak a thought → it lands in Mem. A PWA for Android (Pixel / Chrome).

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY and MEM_API_KEY
node server.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Get Your API Keys

| Key | Where |
|-----|-------|
| `MEM_API_KEY` | mem.ai → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (optional — enables smart cleanup) |

---

## Getting it working on your Android (Pixel)

**Why you need these steps:** Chrome on Android won't allow the microphone unless the page is "secure". The easiest fix is connecting your phone to your Mac with a USB cable — this makes Chrome treat the page as trusted, and the mic prompt will appear.

---

### Step 1 — Plug your Pixel into your Mac with a USB cable

Use the same cable you use to charge it.

---

### Step 2 — Unlock Developer Options on your Pixel

1. Open **Settings** on your Pixel
2. Tap **About phone**
3. Find **Build number** and tap it **7 times in a row**
4. You'll see: *"You are now a developer!"*

---

### Step 3 — Turn on USB Debugging

1. Go back to **Settings**
2. Tap **System** → **Developer options** (now visible at the bottom)
3. Scroll down and turn on **USB debugging**
4. When your phone asks *"Allow USB debugging?"* — tap **Allow**

---

### Step 4 — Install the connection tool (one time only)

On your **Mac**, open the Terminal inside Claude Code desktop (click the `>_` icon at the bottom left). Paste this and press Enter:

```
brew install android-platform-tools
```

Wait for it to finish.

---

### Step 5 — Link your phone to your Mac

Still in the **Terminal on your Mac** (same window as Step 4), paste these two lines one at a time:

```
adb reverse tcp:5173 tcp:5173
adb reverse tcp:3001 tcp:3001
```

Each one should print a number back (like `5173`). That means it worked.

---

### Step 6 — Open the app on your Pixel

Make sure the app is running on your Mac (Step 1–2 of Quick Start above).

On your Pixel, open **Chrome** and go to:

```
http://localhost:5173
```

Chrome will ask for microphone permission. Tap **Allow**.

---

> **Every time you reconnect the USB cable**, re-run the two lines from Step 5.

---

## Installing as a Home Screen App

Once the app is open in Chrome on your Pixel:

1. Tap the **⋮** menu (three dots, top right)
2. Tap **"Add to Home screen"** or **"Install app"**
3. It will now open like a normal app, full screen, no browser bar

---

## App Flow

```
Tap mic → speak → tap again to stop
  → pick a category (or auto-detected)
  → tap "Send to Mem"
  → note appears in your Mem workspace
```

If you're offline, the note is saved locally and sent automatically when you're back online.

---

## Project Structure

```
voice-to-mem/
├── backend/
│   ├── server.js       # Express + Claude + Mem API
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── VoiceButton.jsx
    │   │   ├── CategoryPicker.jsx
    │   │   └── QueueStatus.jsx
    │   ├── hooks/
    │   │   ├── useSpeechRecognition.js
    │   │   └── useOfflineQueue.js
    │   └── services/api.js
    ├── vite.config.js
    └── package.json
```
