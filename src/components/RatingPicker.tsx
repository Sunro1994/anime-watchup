'use client'

type Props = { value: number | null; onChange: (v: number | null) => void }

export function RatingPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`w-9 h-9 rounded-lg text-sm active:scale-95 transition-all ${
            value === n
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-1 ring-purple-400 text-white'
              : 'bg-zinc-900/80 ring-1 ring-zinc-800 text-zinc-400 hover:ring-purple-500/40 hover:text-zinc-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
