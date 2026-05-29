import Link from 'next/link'

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a0f 60%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to TalkBridge
        </Link>
        {children}
      </div>
    </div>
  )
}
