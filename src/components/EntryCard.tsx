import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import type { EntryStatus } from '@/lib/entries/schema'

type Props = {
  id: string
  title: string
  coverUrl: string | null
  status: EntryStatus
  currentEpisode: number
  totalEpisodes: number | null
  rating: number | null
}

export function EntryCard(p: Props) {
  const progress = p.totalEpisodes
    ? `${p.currentEpisode}/${p.totalEpisodes}`
    : `${p.currentEpisode}화`

  return (
    <Link
      href={`/entries/${p.id}`}
      className="flex gap-3 items-center border rounded p-2 hover:bg-gray-50"
    >
      {p.coverUrl && (
        <img src={p.coverUrl} alt="" className="w-12 h-16 object-cover rounded shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{p.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={p.status} />
          <span className="text-xs text-gray-600">{progress}</span>
          {p.rating != null && <span className="text-xs">★ {p.rating}</span>}
        </div>
      </div>
    </Link>
  )
}
