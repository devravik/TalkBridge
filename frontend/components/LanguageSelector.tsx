'use client'

import { LANGUAGES } from '@/types'

interface LanguageSelectorProps {
  value: string
  onChange: (code: string) => void
  label?: string
  className?: string
}

export function LanguageSelector({ value, onChange, label, className = '' }: LanguageSelectorProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-10 text-white text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 cursor-pointer transition-colors"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
              {lang.native} — {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
