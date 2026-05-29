<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://socialify.git.ci/devravik/TalkBridge/image?description=1&font=Inter&language=1&name=1&owner=1&pattern=Solid&theme=Dark" />
  <img alt="TalkBridge" src="https://socialify.git.ci/devravik/TalkBridge/image?description=1&font=Inter&language=1&name=1&owner=1&pattern=Solid&theme=Light" />
</picture>

# TalkBridge

**Real-time video calls with live AI-translated captions — no app, no account, just a link.**

Two people who speak different languages open a browser, share a link, and talk. As each person speaks, their voice is transcribed and translated into the other person's language in under 500ms, overlaid as live captions on the video feed.

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333?style=flat&logo=webrtc)
![Deepgram](https://img.shields.io/badge/Deepgram_Nova--2-13EF93?style=flat)
![Azure](https://img.shields.io/badge/Azure_Translator-0078D4?style=flat&logo=microsoft-azure&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

---

## The Problem

Language barriers make natural conversation hard — not because people lack ideas, but because the tools get in the way. Existing solutions require app installs, accounts, or expensive enterprise contracts. Even then, captions are usually delayed, disconnected from the video, or require a human interpreter.

## What I Built

TalkBridge is a full-stack, real-time communication system that:

- Runs entirely in the browser — no installs, no sign-up for guests
- Streams audio through a WebRTC P2P connection alongside live captions
- Pipes speech through Deepgram Nova-2 for streaming transcription with interim results
- Translates using Azure Cognitive Services (~50–150ms) with an LLM fallback via OpenRouter
- Pushes translated captions back over WebSocket in under 500ms end-to-end
- Supports 10 languages: English, Spanish, French, German, Arabic, Hindi, Portuguese, Korean, Japanese, Simplified Chinese

---

## How It Works

### The User Experience

1. **Host** opens TalkBridge, picks their caption language, creates a room, and shares the link
2. **Guest** opens the link, picks their caption language, joins — no account needed
3. Both participants see each other's speech translated into their own language, live, as an overlay on the video

### The Technical Flow

```
[Microphone]
     │
     ▼
[WebRTC Audio Track] ──── P2P video/audio to remote peer
     │
     ▼ (raw PCM, 16kHz, linear16)
[Go Backend — WebSocket]
     │
     ▼
[Deepgram Nova-2 Streaming API]
  · model: nova-2
  · interim_results: true   ← shows words as you speak
  · endpointing: 300ms      ← detects sentence boundaries
     │
     ▼  transcript (final + interim)
[Translation Service]
  · Primary:  Azure Cognitive Services Translator (~50–150ms)
  · Fallback: OpenRouter / OpenAI LLM (context-aware, slower)
     │
     ▼  translated text
[WebSocket broadcast to room]
     │
     ▼
[Caption Overlay — full-screen, scrollable, 200-caption history]
```

---

## AI Pipeline Design Decisions

### Why Deepgram Nova-2 over Whisper?

Whisper is a batch model — you send audio, wait for a response. Nova-2 is a streaming model that emits partial transcripts as words are spoken (`interim_results: true`). This is what makes captions feel live rather than delayed. The `endpointing: 300ms` setting tells Deepgram when a speaker has paused, so final transcripts flush at natural sentence boundaries rather than on a timer.

### Why Azure Translator as the primary translation path?

The first version used an LLM (OpenRouter) for all translation. LLM inference adds 500ms–2s of latency per request — acceptable for a document, unusable for a live conversation. Azure Cognitive Services Translator is a purpose-built translation API with ~50–150ms latency at the cost of less contextual nuance. The current design uses Azure as the fast path and falls back to the LLM only when no Azure key is configured, preserving the option for quality-sensitive use cases.

### Why WebRTC P2P instead of a media server?

Routing audio/video through a server adds a relay hop and server-side media processing costs. WebRTC lets audio and video travel directly between peers (peer-to-peer), while only the caption data flows through the backend. The TURN server is only used as a fallback when a direct connection isn't possible (e.g. strict NAT). ICE servers are fully configurable via `NEXT_PUBLIC_ICE_SERVERS_JSON`.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser (Next.js)          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ VideoGrid│  │ Caption  │  │ Language  │ │
│  │ (WebRTC) │  │ Overlay  │  │ Selector  │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│          │            ▲                     │
│    WebRTC P2P    WebSocket captions         │
└──────────┼────────────┼────────────────────┘
           │            │
┌──────────┼────────────┼────────────────────┐
│          │     Go Backend (Fiber)           │
│          │  ┌──────────────────────────┐   │
│          │  │   WebSocket Hub          │   │
│          │  │  (room signaling +       │   │
│          │  │   caption broadcast)     │   │
│          │  └──────────────────────────┘   │
│          │         │          │            │
│          │  ┌──────┘   ┌──────────────┐   │
│          │  │ Deepgram │  Translation │   │
│          │  │ Session  │  Service     │   │
│          │  └──────────┘  └──────────┘   │
│          │                    │           │
│          │             ┌──────┴──────┐    │
│          │             │  Azure /    │    │
│          │             │  OpenRouter │    │
│          │             └─────────────┘    │
│                                           │
│  ┌─────────────┐   ┌──────────────────┐  │
│  │ PostgreSQL  │   │  STUN / TURN     │  │
│  │ (rooms,     │   │  (ICE fallback)  │  │
│  │  sessions)  │   └──────────────────┘  │
│  └─────────────┘                         │
└───────────────────────────────────────────┘
```

---

## Features

| Feature | Detail |
|---|---|
| P2P video + audio | WebRTC with configurable STUN/TURN |
| Streaming transcription | Deepgram Nova-2, interim results, 16kHz PCM |
| Real-time translation | Azure Translator primary, LLM fallback |
| Caption overlay | Full-screen, scrollable, 200-caption history |
| Language support | 10 languages (en, es, fr, de, ar, hi, pt, ko, ja, zh-CN) |
| Session persistence | Auto-rejoin on page refresh via localStorage |
| Audio output selector | Choose headset or speaker per session |
| Mobile-first | Works on iOS/Android browsers, no app required |
| Shareable links | One URL per room, no account for guests |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Go, Fiber, Gorilla WebSocket |
| Real-time comms | WebRTC (P2P), WebSocket (signaling + captions) |
| Speech-to-text | Deepgram Nova-2 Streaming API |
| Translation | Azure Cognitive Services Translator, OpenRouter / OpenAI fallback |
| Database | PostgreSQL |
| Infrastructure | Docker, Nginx, Railway, coturn (TURN) |

---

## Database Schema

**rooms** — `id (uuid)`, `room_code`, `created_at`, `expires_at`

**participants** — `id (uuid)`, `room_id`, `display_name`, `language`, `joined_at`

**transcripts** — `id (uuid)`, `room_id`, `participant_id`, `original_text`, `translated_text`, `source_language`, `target_language`, `created_at`

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/rooms` | Create a room, returns `room_id` and join URL |
| `POST` | `/api/v1/rooms/:id/join` | Join a room as a participant |
| `WS` | `/ws/room/:id` | WebSocket — signaling, audio chunks, caption events |
| `POST` | `/api/v1/rooms/:id/end` | End and expire a room |

---

## Self-Hosting

**Prerequisites:** Go 1.22+, Node.js 18+, PostgreSQL, a Deepgram API key, and either an Azure Translator key or an OpenRouter key.

```bash
# Clone
git clone https://github.com/devravik/TalkBridge
cd TalkBridge

# Backend
cp backend/.env.example backend/.env
# Fill in DEEPGRAM_API_KEY, AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION,
# OPENROUTER_API_KEY (fallback), DATABASE_URL
cd backend && go run ./cmd/server

# Frontend
cp frontend/.env.example frontend/.env.local
# Fill in NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
cd frontend && npm install && npm run dev
```

**With Docker Compose:**

```bash
docker compose up --build
```

**Environment variables:**

| Variable | Description |
|---|---|
| `DEEPGRAM_API_KEY` | Deepgram streaming STT |
| `AZURE_TRANSLATOR_KEY` | Azure Cognitive Services (fast path) |
| `AZURE_TRANSLATOR_REGION` | Azure region (e.g. `eastus`) |
| `OPENROUTER_API_KEY` | LLM translation fallback |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | Backend HTTP URL |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL |
| `NEXT_PUBLIC_ICE_SERVERS_JSON` | JSON array of STUN/TURN ICE servers |

---

## Vision

Anyone in the world should be able to have a natural conversation across a language barrier using nothing more than a browser and a shared link.
