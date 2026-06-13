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
    <div className="flex flex-wrap gap-1 border rounded p-2">
      {value.map((t) => (
        <span key={t} className="bg-gray-100 rounded px-2 py-0.5 text-xs flex items-center gap-1">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder="태그 입력 후 Enter"
        className="flex-1 min-w-[120px] outline-none text-sm"
      />
    </div>
  )
}
