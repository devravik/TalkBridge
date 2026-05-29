export interface Room {
  room_id: string
  join_url: string
}

export interface JoinResponse {
  participant_id: string
  room_id: string
  language: string
}

export interface Caption {
  id: string
  text: string
  from: string
  language: string
  isFinal: boolean
  isOwn: boolean
  timestamp: number
}

export interface SignalingMessage {
  type: string
  from?: string
  to?: string
  sdp?: string
  candidate?: RTCIceCandidateInit
  participant_id?: string
  language?: string
  text?: string
  is_final?: boolean
  is_own?: boolean
}

export type CallState = 'lobby' | 'connecting' | 'call' | 'ended'

export const LANGUAGES: { code: string; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh-CN', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
]
