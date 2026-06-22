"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

interface Props {
  from: string
  to:   string
}

const PRESETS = [
  { label: "Hoy",         days: 0 },
  { label: "7 días",      days: 6 },
  { label: "30 días",     days: 29 },
  { label: "Este mes",    days: -1 },
]

export function DateRangePicker({ from, to }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const [f, setF]   = useState(from)
  const [t, setT]   = useState(to)

  function applyPreset(days: number) {
    const toDate   = new Date()
    const fromDate = new Date()
    if (days === -1) {
      fromDate.setDate(1)
    } else {
      fromDate.setDate(toDate.getDate() - days)
    }
    const newFrom = fromDate.toISOString().split("T")[0]
    const newTo   = toDate.toISOString().split("T")[0]
    setF(newFrom)
    setT(newTo)
    router.push(`${pathname}?from=${newFrom}&to=${newTo}`)
  }

  function applyCustom() {
    router.push(`${pathname}?from=${f}&to=${t}`)
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-1">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg
                       text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={f}
          onChange={e => setF(e.target.value)}
          className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <span className="text-zinc-400 text-xs">→</span>
        <input
          type="date"
          value={t}
          onChange={e => setT(e.target.value)}
          className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <button
          onClick={applyCustom}
          className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium
                     hover:bg-zinc-700 transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
