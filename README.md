# TalkBridge

Real-time browser-based video calling with live translated captions.

TalkBridge enables two people who speak different languages to communicate through a simple shareable link. Users join a call directly from their mobile browser without installing any app. As participants speak, their speech is transcribed, translated into the other participant's preferred language, and displayed as live captions.

## Problem

Language barriers make communication difficult between:

* Travelers and locals
* International clients and freelancers
* Remote teams
* Language exchange partners
* Friends and family who speak different languages

Existing solutions often require app installation, account creation, or expensive enterprise software.

## Solution

TalkBridge provides:

* Browser-based video calls
* No app installation
* No account required for guests
* Real-time speech transcription
* Live translated captions
* Mobile-first experience
* Simple shareable links

## How It Works

### User A

1. Opens TalkBridge
2. Selects preferred caption language
3. Creates a call
4. Receives a unique call URL
5. Shares the URL with User B

### User B

1. Opens the shared URL
2. Selects preferred caption language
3. Joins the call

### During the Call

When User A speaks:

* Speech is transcribed in real time
* Text is translated into User B's selected language
* Captions appear instantly for User B

When User B speaks:

* Speech is transcribed in real time
* Text is translated into User A's selected language
* Captions appear instantly for User A

## Example

User A Language: English

User B Language: Spanish

User A says:

"Hello, how are you?"

User B sees:

"Hola, ¿cómo estás?"

User B says:

"Estoy bien."

User A sees:

"I am fine."

## Key Features

### MVP

* One-to-one video calls
* One-to-one audio calls
* Real-time translated captions
* Mobile browser support
* Shareable call links
* Language selection (ar, en, es, fr, de, zh-CN, pt, ko, ja)
* Call status indicators
* AI-generated summaries

## Architecture

### Frontend

* Next.js
* TypeScript
* WebRTC
* Tailwind CSS
* WebSocket Client

### Backend

* Go
* Fiber
* PostgreSQL
* Redis
* WebSocket Gateway

### AI Services

#### Speech-to-Text

Deepgram Streaming API

Responsibilities:

* Live transcription
* Speaker identification

#### Translation

OpenRouter or OpenAI

Responsibilities:

* Real-time translation
* Language normalization
* Context-aware translations

### Communication Layer

WebRTC

Responsibilities:

* Peer-to-peer audio
* Peer-to-peer video
* Low latency communication

### Infrastructure

* Docker
* Nginx
* VPS or Cloud Deployment
* TURN Server
* STUN Server

## Technical Flow

User Microphone
↓
WebRTC Audio Stream
↓
Deepgram Streaming API
↓
Transcript
↓
Translation Service
↓
Translated Text
↓
WebSocket
↓
Live Captions

## Database Schema

### Rooms

| Field      | Type      |
| ---------- | --------- |
| id         | uuid      |
| room_code  | string    |
| created_at | timestamp |
| expires_at | timestamp |

### Participants

| Field        | Type      |
| ------------ | --------- |
| id           | uuid      |
| room_id      | uuid      |
| display_name | string    |
| language     | string    |
| joined_at    | timestamp |

### Transcripts

| Field           | Type      |
| --------------- | --------- |
| id              | uuid      |
| room_id         | uuid      |
| participant_id  | uuid      |
| original_text   | text      |
| translated_text | text      |
| source_language | string    |
| target_language | string    |
| created_at      | timestamp |

## API Endpoints

### Create Room

POST /api/v1/rooms

Response:

{
"room_id": "abc123",
"join_url": "https://talkbridge.app/c/abc123"
}

### Join Room

POST /api/v1/rooms/{roomId}/join

### WebSocket

GET /ws/room/{roomId}

### End Room

POST /api/v1/rooms/{roomId}/end

## Revenue Model

### Free Right now only for internal use but in future 

## Vision

Enable anyone in the world to communicate naturally regardless of language, using nothing more than a browser and a shared link.
