'use client'

import { Minus, Plus } from 'lucide-react'

type Props = {
  value: number
  max: number | null
  onChange: (v: number) => void
}

export function EpisodeStepper({ value, max, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 rounded-lg bg-zinc-900/80 ring-1 ring-zinc-800 hover:ring-purple-500/40 hover:bg-zinc-800 active:scale-95 transition-all text-zinc-200 flex items-center justify-center"
      >
        <Minus size={16} />
      </button>
      <span className="font-mono text-lg text-zinc-100 min-w-[5rem] text-center">
        {value}
        {max ? ` / ${max}` : ''}
      </span>
      <button
        type="button"
        onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
        className="w-9 h-9 rounded-lg bg-zinc-900/80 ring-1 ring-zinc-800 hover:ring-purple-500/40 hover:bg-zinc-800 active:scale-95 transition-all text-zinc-200 flex items-center justify-center"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
