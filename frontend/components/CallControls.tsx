'use client'

interface CallControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onEndCall: () => void
  onShareLink?: () => void
  shareLink?: string
}

function ControlButton({
  active,
  danger = false,
  onClick,
  children,
  label,
}: {
  active?: boolean
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`
        flex flex-col items-center gap-1 group
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150
          ${
            danger
              ? 'bg-red-500 hover:bg-red-400 active:bg-red-600'
              : active === false
              ? 'bg-white/10 hover:bg-white/20 active:bg-white/15'
              : 'bg-white/10 hover:bg-white/20 active:bg-white/15'
          }
          ${active === false && !danger ? 'ring-1 ring-red-400/60' : ''}
        `}
      >
        {children}
      </div>
      <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
    </button>
  )
}

export function CallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onShareLink,
  shareLink,
}: CallControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 px-6 pb-6 pt-8 bg-gradient-to-t from-black/60 to-transparent">
      {/* Mute toggle */}
      <ControlButton active={audioEnabled} onClick={onToggleAudio} label={audioEnabled ? 'Mute' : 'Unmute'}>
        {audioEnabled ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </ControlButton>

      {/* Video toggle */}
      <ControlButton active={videoEnabled} onClick={onToggleVideo} label={videoEnabled ? 'Hide Video' : 'Show Video'}>
        {videoEnabled ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z M3 3l18 18" />
          </svg>
        )}
      </ControlButton>

      {/* End call */}
      <ControlButton danger onClick={onEndCall} label="End Call">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </ControlButton>

      {/* Share link */}
      {onShareLink && (
        <ControlButton onClick={onShareLink} label="Share">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </ControlButton>
      )}
    </div>
  )
}
