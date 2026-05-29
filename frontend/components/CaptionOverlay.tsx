'use client'

import { useEffect, useRef } from 'react'
import type { Caption } from '@/types'

interface CaptionOverlayProps {
  captions: Caption[]
}

const CAPTION_MAX_AGE_MS = 8000

export function CaptionOverlay({ captions }: CaptionOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [captions])

  const now = Date.now()
  const visible = captions.filter((c) => now - c.timestamp < CAPTION_MAX_AGE_MS)

  if (visible.length === 0) return null

  return (
    <div className="pointer-events-none absolute bottom-20 left-0 right-0 px-4 max-h-40 flex flex-col justify-end">
      <div ref={scrollRef} className="overflow-y-auto max-h-40 flex flex-col gap-1.5">
        {visible.map((caption) => (
          <div
            key={caption.id}
            className={`caption-enter flex ${caption.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed
                backdrop-blur-md shadow-lg
                ${
                  caption.isOwn
                    ? 'bg-indigo-600/80 text-white'
                    : 'bg-black/60 text-white/90'
                }
                ${!caption.isFinal ? 'opacity-60 italic' : 'opacity-100'}
              `}
            >
              {caption.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
