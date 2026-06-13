'use client'

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
        className="w-8 h-8 border rounded"
      >
        −
      </button>
      <span className="font-mono">
        {value}
        {max ? ` / ${max}` : ''}
      </span>
      <button
        type="button"
        onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
        className="w-8 h-8 border rounded"
      >
        +
      </button>
    </div>
  )
}
