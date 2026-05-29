'use client'

import { useEffect, useRef, useState } from 'react'
import type { Caption } from '@/types'

interface CaptionOverlayProps {
  captions: Caption[]
}

export function CaptionOverlay({ captions }: CaptionOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  const [showNudge, setShowNudge] = useState(false)

  // Auto-scroll to bottom unless user has scrolled up to read history
  useEffect(() => {
    const el = scrollRef.current
    if (!el || userScrolledRef.current) return
    el.scrollTop = el.scrollHeight
  }, [captions])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const scrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight >= 40
    userScrolledRef.current = scrolledUp
    setShowNudge(scrolledUp)
  }

  if (captions.length === 0) return null

  return (
    <div className="absolute inset-0 bottom-20 pointer-events-none flex flex-col justify-end">
      {/* Full-screen scrollable caption area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="pointer-events-auto overflow-y-auto px-4 pb-3 pt-16 flex flex-col gap-2"
        style={{
          maxHeight: '100%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.6) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
        }}
      >
        {captions.map((caption) => (
          <div
            key={caption.id}
            className={`caption-enter flex ${caption.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-2.5 rounded-2xl text-base leading-snug font-medium
                shadow-lg backdrop-blur-sm
                ${caption.isOwn
                  ? 'bg-indigo-600/75 text-white rounded-br-sm'
                  : 'bg-black/50 text-white/95 rounded-bl-sm'
                }
                ${!caption.isFinal ? 'opacity-50 italic' : 'opacity-100'}
              `}
            >
              {caption.text}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll-to-bottom nudge when user has scrolled up */}
      {showNudge && (
        <button
          className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white/80 text-xs backdrop-blur-sm border border-white/10 hover:bg-black/80 transition-colors"
          onClick={() => {
            userScrolledRef.current = false
            setShowNudge(false)
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          New captions
        </button>
      )}
    </div>
  )
}
