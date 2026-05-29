export default function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}
