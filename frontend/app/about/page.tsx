import PageShell from '@/components/PageShell'

export const metadata = {
  title: 'About — TalkBridge',
  description: 'How TalkBridge works and who built it.',
}

const links = [
  {
    label: 'Portfolio',
    href: 'https://devravik.github.io/',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/devravik',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ravi-k-dev',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Stack Overflow',
    href: 'https://stackoverflow.com/users/3894259/k-ravi',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/kravishots',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
]

export default function AboutPage() {
  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">About TalkBridge</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time translated video calls</p>
        </div>
      </div>

      {/* Product section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <h2 className="text-base font-semibold text-white mb-3">What is TalkBridge?</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          TalkBridge lets two people who speak different languages have a natural video conversation — no interpreter, no app to install, no account to create. Open a browser, share a link, and talk. Captions are translated live and overlaid on the video feed.
        </p>

        <h3 className="text-sm font-semibold text-gray-300 mb-2 mt-5">How the AI pipeline works</h3>
        <ol className="space-y-2.5 text-sm text-gray-400">
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Your microphone audio is streamed to <span className="text-gray-300">Deepgram Nova-2</span>, a real-time speech recognition model that emits partial transcripts as you speak — making captions feel instant rather than delayed.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Each transcript is translated using <span className="text-gray-300">Azure Cognitive Services Translator</span> (~50–150ms), with an LLM fallback via OpenRouter for context-aware translation when needed.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>The translated text is pushed over WebSocket to the other participant, appearing as a live caption overlay on the video — end-to-end in under 500ms.</span>
          </li>
        </ol>

        <div className="mt-5 pt-5 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3">Supported languages</p>
          <div className="flex flex-wrap gap-2">
            {['English', 'Español', 'Français', 'Deutsch', 'العربية', 'हिन्दी', 'Português', '한국어', '日本語', '中文'].map((lang) => (
              <span key={lang} className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/5">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <h2 className="text-base font-semibold text-white mb-3">Tech stack</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ['Frontend', 'Next.js 14, TypeScript, Tailwind'],
            ['Backend', 'Go, Fiber, WebSocket'],
            ['Video / Audio', 'WebRTC (peer-to-peer)'],
            ['Speech-to-text', 'Deepgram Nova-2'],
            ['Translation', 'Azure Translator + OpenRouter'],
            ['Database', 'PostgreSQL'],
            ['Infra', 'Docker, Nginx, Railway'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-gray-600 text-xs">{label}</span>
              <span className="text-gray-300">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Builder section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Built by</h2>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">Ravi K</p>
            <p className="text-gray-500 text-sm">Delhi, India</p>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Full-stack developer with a focus on real-time systems and AI-powered products. Built TalkBridge to explore the intersection of WebRTC, streaming speech recognition, and low-latency translation pipelines.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
              <a
                href="mailto:dev.ravikgupt@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
