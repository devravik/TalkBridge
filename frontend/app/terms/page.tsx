import PageShell from '@/components/PageShell'

export const metadata = {
  title: 'Terms of Use — TalkBridge',
  description: 'Terms of use for TalkBridge.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Terms of Use</h1>
        <p className="text-sm text-gray-500 mt-1">Last updated: May 2026</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-sm text-gray-400 leading-relaxed">
          TalkBridge is a personal project provided free of charge. By using it, you agree to the following terms.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">

        <Section title="Acceptable use">
          <p>
            You may use TalkBridge for personal, non-commercial communication. You agree not to use it to transmit unlawful, abusive, or harmful content, or to attempt to reverse-engineer, overload, or disrupt the service.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="No warranty">
          <p>
            TalkBridge is provided &quot;as is&quot; without any warranty of availability, reliability, or fitness for a particular purpose. Calls may drop, captions may be inaccurate, and the service may be unavailable without notice.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="No SLA or uptime guarantee">
          <p>
            This is a personal project, not a commercial service. There is no guaranteed uptime, no SLA, and no commitment to maintain the service indefinitely.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Your content">
          <p>
            You are solely responsible for what you say during calls. TalkBridge does not moderate, review, or take responsibility for the content of conversations.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Third-party services">
          <p>
            TalkBridge uses Deepgram, Azure Cognitive Services, and OpenRouter to process speech and translation. Use of these services is subject to their respective terms and privacy policies.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Limitation of liability">
          <p>
            To the extent permitted by law, TalkBridge and its creator shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Changes to these terms">
          <p>
            These terms may be updated at any time. Continued use of TalkBridge after changes constitutes acceptance.
          </p>
        </Section>

        <div className="border-t border-white/5" />

        <Section title="Contact">
          <p>
            Questions?{' '}
            <a href="mailto:dev.ravikgupt@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              dev.ravikgupt@gmail.com
            </a>
          </p>
        </Section>

      </div>
    </PageShell>
  )
}
