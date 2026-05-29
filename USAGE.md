# TalkBridge — Usage Guide

## Quick Start

```bash
cp .env.example .env   # first time only — add your API keys
./start.sh
```

Open `https://192.168.29.220:3000` (or `http://localhost:3000` if TLS is not configured).

---

## Prerequisites

| Requirement | Purpose |
|---|---|
| Go 1.22+ | Backend server |
| Node.js 20+ | Frontend (Next.js) |
| PostgreSQL | Room & transcript storage |
| Redis | Session cache |

PostgreSQL and Redis can be started with Docker:

```bash
docker compose up -d postgres redis
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the required keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `DEEPGRAM_API_KEY` | Yes | Speech-to-text ([get key](https://console.deepgram.com)) |
| `OPENROUTER_API_KEY` | Yes* | Translation model via OpenRouter |
| `OPENAI_API_KEY` | Yes* | Alternative: OpenAI directly |
| `FRONTEND_URL` | No | Origin for CORS (default `*`) |
| `TLS_CERT` | No | Path to TLS certificate (enables HTTPS) |
| `TLS_KEY` | No | Path to TLS private key |
| `PORT` | No | Backend port (default `8080`) |

*Either `OPENROUTER_API_KEY` or `OPENAI_API_KEY` is required for translation.

---

## Running

### One command (recommended)

```bash
./start.sh
```

Starts both backend and frontend. Press `Ctrl+C` to stop both.

### Manually (two terminals)

**Terminal 1 — backend:**
```bash
cd backend
go run ./cmd/server/...
```

**Terminal 2 — frontend:**
```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8080 \
NEXT_PUBLIC_WS_URL=ws://localhost:8080 \
npm run dev
```

---

## Local Network Access (phone / tablet)

Mobile browsers require **HTTPS** to access the camera and microphone on non-localhost addresses.

### Step 1 — Generate a certificate (one time)

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/CN=TalkBridge-Local" \
  -addext "subjectAltName=IP:192.168.29.220,IP:127.0.0.1,DNS:localhost"
```

Replace `192.168.29.220` with your machine's LAN IP (`ip route get 1.1.1.1 | grep -oP 'src \K\S+'`).

### Step 2 — Add cert paths to `.env`

```
FRONTEND_URL=https://192.168.29.220:3000
TLS_CERT=/var/www/TalkBridge/certs/cert.pem
TLS_KEY=/var/www/TalkBridge/certs/key.pem
```

### Step 3 — Run

```bash
./start.sh
```

### Step 4 — On each device

1. Open **`https://192.168.29.220:3000`** in the mobile browser
2. Tap **Advanced → Proceed** (or "Visit Anyway") to accept the self-signed cert warning — once per device
3. When prompted, allow **camera and microphone**

---

## How It Works

### Creating a call

1. Open TalkBridge in your browser
2. Click **Start a Call**
3. You land on the call room page — pick your **caption language** (the language you want to *read*)
4. Click **Join Call** — your camera turns on
5. Copy the URL from the share button and send it to the other person

### Joining a call

1. Open the shared link
2. Pick your **caption language**
3. Click **Join Call**

### During the call

- **You speak** → your speech is transcribed and translated into the other person's language → they see it as a caption
- **They speak** → their speech is translated into your language → you see it as a caption
- Interim captions appear grayed out as you speak; they sharpen when the sentence is complete

### Controls

| Button | Action |
|---|---|
| Microphone | Mute / unmute your audio |
| Camera | Turn video on / off |
| Phone (red) | End the call for both sides |
| Share | Copy the room link to clipboard |

---

## Supported Languages

| Code | Language |
|---|---|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `pt` | Portuguese |
| `zh-CN` | Chinese (Simplified) |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |
| `hi` | Hindi |

Each participant independently picks their language. The two can be different.

---

## Architecture Overview

```
Browser A                          Server                        Browser B
─────────────────────────────────────────────────────────────────────────────
  Mic audio ──► AudioWorklet ──► /ws/audio ──► Deepgram STT
                                                    │
                                               Transcript
                                                    │
                                           OpenRouter translate
                                                    │
                                     /ws/room caption message ──────────► Caption display

  WebRTC offer ──────────────────► /ws/room ──────────────────────────────► WebRTC answer
  ICE candidates ◄────────────── /ws/room ◄──────────────────────────── ICE candidates

  Video / Audio ◄═══════════════ P2P WebRTC ══════════════════════════► Video / Audio
```

- **Video and audio** travel peer-to-peer via WebRTC (server is not in the media path)
- **Audio for transcription** is sent separately to the server as raw PCM at 16 kHz
- **Captions** flow through the server's WebSocket hub

---

## Troubleshooting

**Camera/mic blocked on phone**
→ The page must be served over HTTPS. Follow the [Local Network Access](#local-network-access-phone--tablet) steps above.

**"Room not found" on join**
→ The room link expires after 24 hours. Create a new call.

**No captions appearing**
→ Check that `DEEPGRAM_API_KEY` is set in `.env` and the key is valid at [console.deepgram.com](https://console.deepgram.com).

**Translations not working**
→ Check that `OPENROUTER_API_KEY` (or `OPENAI_API_KEY`) is set and has credit.

**Black video / no remote video**
→ WebRTC peer connection failed — likely a firewall or NAT issue. On a local network this should work. For internet calls, add a TURN server to the ICE config in `frontend/lib/webrtc.ts`.

**Backend won't connect to database**
→ Verify `DATABASE_URL` in `.env`. If using Docker, run `docker compose up -d postgres redis` first.
