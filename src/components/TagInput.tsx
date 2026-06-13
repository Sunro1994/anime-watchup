'use client'

import { useState, type KeyboardEvent } from 'react'

type Props = { value: string[]; onChange: (v: string[]) => void }

export function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  function commit() {
    const v = input.trim()
    if (!v || value.includes(v)) {
      setInput('')
      return
    }
    onChange([...value, v])
    setInput('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !input) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 bg-zinc-900/80 ring-1 ring-zinc-800 focus-within:ring-purple-500/60 rounded-lg p-2 transition-all">
      {value.map((t) => (
        <span
          key={t}
          className="bg-purple-500/15 ring-1 ring-purple-500/30 text-purple-200 rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="text-purple-300 hover:text-pink-300 transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder="태그 입력 후 Enter"
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-zinc-100 placeholder:text-zinc-500"
      />
    </div>
  )
}
