'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { joinRoom } from '@/lib/api'
import { SignalingSocket, AudioSocket } from '@/lib/websocket'
import { WebRTCManager } from '@/lib/webrtc'
import { AudioCapture } from '@/lib/audio'
import { VideoGrid } from '@/components/VideoGrid'
import { CaptionOverlay } from '@/components/CaptionOverlay'
import { CallControls } from '@/components/CallControls'
import { LanguageSelector } from '@/components/LanguageSelector'
import type { Caption, CallState, SignalingMessage } from '@/types'
import type { AudioOutputDevice } from '@/components/CallControls'

export default function CallPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const sessionKey = `talkbridge-room-${roomId}`

  const [callState, setCallState] = useState<CallState>('lobby')
  const [language, setLanguage] = useState('en')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [autoJoining, setAutoJoining] = useState(true) // true while checking for saved session
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [participantId, setParticipantId] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')
  const [audioOutputDevices, setAudioOutputDevices] = useState<AudioOutputDevice[]>([])
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string>('')

  const signalingRef = useRef<SignalingSocket | null>(null)
  const audioSocketRef = useRef<AudioSocket | null>(null)
  const webrtcRef = useRef<WebRTCManager | null>(null)
  const audioCaptureRef = useRef<AudioCapture | null>(null)
  const captionIdRef = useRef(0)
  const cleaningUp = useRef(false)
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addCaption = useCallback((text: string, from: string, lang: string, isFinal: boolean, isOwn: boolean) => {
    setCaptions((prev) => {
      const id = String(++captionIdRef.current)
      // Replace existing interim caption from same speaker, or append
      const withoutInterim = prev.filter((c) => !(c.from === from && !c.isFinal))
      return [...withoutInterim, { id, text, from, language: lang, isFinal, isOwn, timestamp: Date.now() }]
    })
  }, [])

  const cleanup = useCallback(() => {
    if (cleaningUp.current) return
    cleaningUp.current = true
    audioCaptureRef.current?.stop()
    audioSocketRef.current?.close()
    webrtcRef.current?.close()
    signalingRef.current?.close()
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current)
    }
  }, [cleanup])

  // On mount: check for a saved session for this room and auto-rejoin
  useEffect(() => {
    let cancelled = false
    const saved = localStorage.getItem(sessionKey)
    if (!saved) {
      setAutoJoining(false)
      return
    }
    let savedLang: string
    try {
      savedLang = (JSON.parse(saved) as { language: string }).language
    } catch {
      localStorage.removeItem(sessionKey)
      setAutoJoining(false)
      return
    }
    setLanguage(savedLang)
    joinRoom(roomId, savedLang)
      .then((res) => {
        if (cancelled) return
        setAutoJoining(false)
        setParticipantId(res.participant_id)
        setCallState('connecting')
        return startCall(res.participant_id, res.language)
      })
      .catch((e: any) => {
        if (cancelled) return
        localStorage.removeItem(sessionKey)
        if (e.message?.includes('ended')) {
          setCallState('ended')
        } else {
          setAutoJoining(false)
        }
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // Keep last 200 captions to avoid unbounded memory growth
  useEffect(() => {
    if (captions.length > 200) {
      setCaptions((prev) => prev.slice(-200))
    }
  }, [captions.length])

  async function handleJoin() {
    setJoining(true)
    setJoinError('')
    try {
      const res = await joinRoom(roomId, language)
      localStorage.setItem(sessionKey, JSON.stringify({ language: res.language }))
      setParticipantId(res.participant_id)
      setCallState('connecting')
      await startCall(res.participant_id, res.language)
    } catch (e: any) {
      setJoinError(e.message || 'Failed to join. Please try again.')
      setJoining(false)
    }
  }

  async function startCall(pid: string, lang: string) {
    cleaningUp.current = false

    // Set up WebRTC
    const webrtc = new WebRTCManager(
      (stream) => setRemoteStream(stream),
      (candidate) => {
        signalingRef.current?.send({ type: 'ice-candidate', candidate: candidate.toJSON() })
      },
      (state) => {
        setConnectionState(state)
        if (state === 'connected') setCallState('call')
        if (state === 'failed' || state === 'disconnected') {
          // attempt to show the call UI anyway, don't hard-fail
          setCallState('call')
        }
      },
    )
    webrtcRef.current = webrtc

    const stream = await webrtc.init(true, true)
    setLocalStream(stream)

    // Enumerate audio output devices (requires getUserMedia to have been called first)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const outputs = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 6)}` }))
        setAudioOutputDevices(outputs)
        // Default to the first non-default device if available
        const preferred = outputs.find((d) => d.deviceId !== 'default') || outputs[0]
        if (preferred) setAudioOutputDeviceId(preferred.deviceId)
      }).catch(() => { /* not supported */ })
    }

    // Set up signaling WebSocket
    const signaling = new SignalingSocket()
    signalingRef.current = signaling

    signaling.on('participant-joined', async (msg: SignalingMessage) => {
      // A new participant joined — we create the offer
      try {
        const offer = await webrtc.createOffer()
        signaling.send({ type: 'offer', sdp: offer.sdp, to: msg.participant_id })
      } catch (err) {
        console.error('createOffer failed', err)
      }
    })

    signaling.on('offer', async (msg: SignalingMessage) => {
      try {
        const answer = await webrtc.handleOffer({ type: 'offer', sdp: msg.sdp })
        signaling.send({ type: 'answer', sdp: answer.sdp, to: msg.from })
        setCallState('call')
      } catch (err) {
        console.error('handleOffer failed', err)
      }
    })

    signaling.on('answer', async (msg: SignalingMessage) => {
      try {
        await webrtc.handleAnswer({ type: 'answer', sdp: msg.sdp })
        setCallState('call')
      } catch (err) {
        console.error('handleAnswer failed', err)
      }
    })

    signaling.on('ice-candidate', async (msg: SignalingMessage) => {
      if (msg.candidate) {
        try {
          await webrtc.addIceCandidate(msg.candidate)
        } catch {
          // Ignore ICE errors
        }
      }
    })

    signaling.on('caption', (msg: SignalingMessage) => {
      if (msg.text) {
        addCaption(msg.text, msg.from || 'remote', msg.language || lang, !!msg.is_final, !!msg.is_own)
      }
    })

    signaling.on('end-call', () => {
      handleCallEnded()
    })

    signaling.on('participant-left', () => {
      setRemoteStream(null)
    })

    await signaling.connect(roomId, pid, lang)
    setCallState('call')

    // Start audio streaming for STT
    try {
      const audioSocket = new AudioSocket()
      audioSocketRef.current = audioSocket
      await audioSocket.connect(roomId, pid, lang)

      const audioCapture = new AudioCapture(audioSocket)
      audioCaptureRef.current = audioCapture
      await audioCapture.start(stream)
    } catch (err) {
      console.warn('Audio STT setup failed (Deepgram may not be configured):', err)
    }
  }

  function handleCallEnded() {
    cleanup()
    localStorage.removeItem(sessionKey)
    setCallState('ended')
  }

  function handleEndCall() {
    signalingRef.current?.send({ type: 'end-call' })
    handleCallEnded()
  }

  function handleToggleAudio() {
    const next = !audioEnabled
    setAudioEnabled(next)
    webrtcRef.current?.toggleAudio(next)
  }

  function handleToggleVideo() {
    const next = !videoEnabled
    setVideoEnabled(next)
    webrtcRef.current?.toggleVideo(next)
  }

  async function handleShareLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      linkCopiedTimerRef.current = setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      // fallback: show the URL
      window.prompt('Share this link:', url)
    }
  }

  // ── Auto-joining (checking saved session) ─────────────────────────────
  if (autoJoining && callState === 'lobby') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </main>
    )
  }

  // ── Lobby ──────────────────────────────────────────────────────────────
  if (callState === 'lobby') {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a0f 60%)' }}
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center mb-4 shadow-2xl shadow-indigo-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Join Call</h1>
            <p className="mt-1 text-gray-500 text-sm">Room: <code className="text-indigo-400 font-mono">{roomId}</code></p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <LanguageSelector
              label="Caption language — what language do you want to read?"
              value={language}
              onChange={setLanguage}
            />

            {joinError && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining…
                </span>
              ) : (
                'Join Call'
              )}
            </button>
          </div>

          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← Create your own call
          </button>
        </div>
      </main>
    )
  }

  // ── Connecting ─────────────────────────────────────────────────────────
  if (callState === 'connecting') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
          <p className="text-gray-400">Connecting to call…</p>
        </div>
      </main>
    )
  }

  // ── Ended ──────────────────────────────────────────────────────────────
  if (callState === 'ended') {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a0f 60%)' }}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Call Ended</h2>
            <p className="mt-1 text-gray-500 text-sm">The call has finished.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Start New Call
          </button>
        </div>
      </main>
    )
  }

  // ── Active call ────────────────────────────────────────────────────────
  return (
    <main className="h-screen w-screen overflow-hidden relative" style={{ background: '#0a0a0f' }}>
      {/* Video grid */}
      <div className="absolute inset-0">
        <VideoGrid localStream={localStream} remoteStream={remoteStream} audioOutputDeviceId={audioOutputDeviceId} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe-top pb-3 pt-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
            }`}
          />
          <span className="text-xs text-white/60">{roomId}</span>
        </div>

        {linkCopied ? (
          <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">Link copied!</span>
        ) : (
          <button
            onClick={handleShareLink}
            className="text-xs text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        )}
      </div>

      {/* Captions */}
      <CaptionOverlay captions={captions} />

      {/* Controls */}
      <CallControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onEndCall={handleEndCall}
        onShareLink={handleShareLink}
        audioOutputDevices={audioOutputDevices}
        audioOutputDeviceId={audioOutputDeviceId}
        onAudioOutputChange={setAudioOutputDeviceId}
      />
    </main>
  )
}
