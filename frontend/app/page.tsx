'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRoom } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const room = await createRoom()
      router.push(`/c/${room.room_id}`)
    } catch (e) {
      setError('Could not create room. Is the server running?')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a0f 60%)' }}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">TalkBridge</h1>
          <p className="mt-2 text-gray-400 text-base max-w-xs">
            Real-time video calls with live translated captions. No app needed.
          </p>
        </div>
      </div>

      {/* Create call card */}
      <div className="w-full max-w-sm">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-400 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-300">Create a call and share the link</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-400 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-300">Each person picks their language</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-400 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">Speak naturally — captions translate in real time</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 text-white font-semibold text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </span>
            ) : (
              'Start a Call'
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          No account required · Works in any modern browser
        </p>
      </div>

      {/* Language badges */}
      <div className="mt-10 flex flex-wrap justify-center gap-2 max-w-xs opacity-40">
        {['English', 'Español', 'Français', '中文', '日本語', 'Deutsch', '한국어', 'العربية'].map((lang) => (
          <span key={lang} className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/5">
            {lang}
          </span>
        ))}
      </div>
    </main>
  )
}
