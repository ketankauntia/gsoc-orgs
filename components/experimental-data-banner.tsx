'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

const STORAGE_KEY = 'gsoc-orgs:experimental-banner-dismissed:v1'

export function ExperimentalDataBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY)
      return !dismissed
    } catch {
      return true
    }
  })

  if (!visible) return null

  const handleClose = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  return (
    <div className="w-full bg-teal-600 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-start gap-3 text-xs sm:text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-white/80" aria-hidden="true" />
        <div className="flex-1 space-y-0.5">
          <p className="font-medium">
            Some parts of this site are still experimental and being improved for better analytics. Organization details are stable.
          </p>
          <p className="opacity-90">
            Features like <span className="font-semibold">&quot;first-time organizations&quot; counts</span>, the{' '}
            <span className="font-semibold">filter sidebar</span>, and{' '}
            <span className="font-semibold">difficulty filters (Beginner, Intermediate, Hard)</span> may use
            placeholder or incomplete data. We&apos;re working on this and expect updates by{' '}
            <span className="font-semibold">27&nbsp;Dec&nbsp;2025</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss experimental data notice"
          className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

