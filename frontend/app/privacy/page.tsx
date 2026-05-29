import PageShell from '@/components/PageShell'

export const metadata = {
  title: 'Privacy Policy — TalkBridge',
  description: 'How TalkBridge handles your data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-1">Last updated: May 2026</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-sm text-gray-400 leading-relaxed">
          TalkBridge is a personal project. This policy explains plainly what data passes through the system, what is stored, and what is not.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">

        <Section title="Video and audio">
          <p>
            Video and audio streams travel directly between participants using WebRTC (peer-to-peer). They are <span className="text-gray-300">never routed through or stored on TalkBridge servers</span>. A TURN relay server is used only as a last resort when a direct connection cannot be established — it forwards encrypted packets and does not record or inspect them.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Speech transcription">
          <p>
            To generate captions, audio chunks from your microphone are sent to <span className="text-gray-300">Deepgram</span> for real-time speech-to-text processing. Deepgram&apos;s own privacy policy governs how they handle that audio. TalkBridge does not retain raw audio.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Transcripts and translations">
          <p>
            Transcribed and translated text is stored in a PostgreSQL database linked to your room session. This allows captions to be delivered to the other participant over WebSocket.
          </p>
          <p>
            Transcript records are tied to an anonymous room code — no name, email, or account is required. Room data expires automatically after the session ends.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Translation">
          <p>
            Transcript text is sent to <span className="text-gray-300">Azure Cognitive Services Translator</span> (primary) or an LLM via <span className="text-gray-300">OpenRouter</span> (fallback). These third-party services receive only the transcript text, not your audio or identity.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="No accounts, no tracking">
          <p>
            TalkBridge requires no account, login, or personal information. There are no cookies beyond what is strictly necessary for session management, no analytics scripts, and no advertising.
          </p>
          <p>
            A room session ID is saved to <span className="text-gray-300">localStorage</span> in your browser solely to allow automatic rejoin if you refresh during a call. It is not used for tracking.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Contact">
          <p>
            Questions about this policy? Email{' '}
            <a href="mailto:dev.ravikgupt@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              dev.ravikgupt@gmail.com
            </a>
            .
          </p>
        </Section>

      </div>
    </PageShell>
  )
}
