'use client'

import { useEffect, useRef } from 'react'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  localMuted?: boolean
  audioOutputDeviceId?: string
}

function VideoTile({
  stream,
  muted = false,
  label,
  isLocal = false,
  audioOutputDeviceId,
}: {
  stream: MediaStream | null
  muted?: boolean
  label?: string
  isLocal?: boolean
  audioOutputDeviceId?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    const el = videoRef.current as any
    if (!el || !audioOutputDeviceId || !el.setSinkId) return
    el.setSinkId(audioOutputDeviceId).catch(() => {
      // setSinkId not supported or permission denied — silently ignore
    })
  }, [audioOutputDeviceId])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#1a1a24] ${
        isLocal ? 'aspect-video' : 'w-full h-full'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
        style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2">
          <span className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}

export function VideoGrid({ localStream, remoteStream, localMuted = true, audioOutputDeviceId }: VideoGridProps) {
  const hasRemote = !!remoteStream

  return (
    <div className="relative w-full h-full">
      {/* Remote video fills the frame */}
      <div className="w-full h-full">
        <VideoTile stream={remoteStream} label={hasRemote ? 'Participant' : undefined} audioOutputDeviceId={audioOutputDeviceId} />
        {!hasRemote && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">Waiting for participant to join…</p>
          </div>
        )}
      </div>

      {/* Local video: picture-in-picture in the corner */}
      <div className="absolute top-3 right-3 w-28 md:w-40 shadow-2xl rounded-xl overflow-hidden border border-white/10">
        <VideoTile stream={localStream} muted={localMuted} isLocal label="You" />
      </div>
    </div>
  )
}
