'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tv } from 'lucide-react'
import { EntryCard } from '@/components/EntryCard'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'
import { STATUS_LABEL } from '@/components/StatusBadge'

const TABS: { value: EntryStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  ...STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
]

export type ListItem = {
  id: string
  status: EntryStatus
  currentEpisode: number
  rating: number | null
  title: string
  coverUrl: string | null
  totalEpisodes: number | null
}

type Props = {
  items: ListItem[]
  initialStatus: EntryStatus | 'all'
}

export function ListView({ items, initialStatus }: Props) {
  const [status, setStatus] = useState<EntryStatus | 'all'>(initialStatus)

  function selectTab(value: EntryStatus | 'all') {
    setStatus(value)
    const url = value === 'all' ? '/list' : `/list?status=${value}`
    window.history.replaceState(null, '', url)
  }

  const filtered = status === 'all' ? items : items.filter((i) => i.status === status)
  const count = filtered.length

  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-zinc-100">내 목록</h1>
        {count > 0 && <p className="text-sm text-zinc-400">작품 {count}개</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => selectTab(t.value)}
            className={`whitespace-nowrap text-sm rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
              status === t.value
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50 text-white'
                : 'bg-zinc-900/50 ring-1 ring-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Tv className="w-12 h-12 text-zinc-600" />
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">
              {items.length === 0 ? '아직 등록한 작품이 없어요' : '이 상태의 작품이 없어요'}
            </p>
            {items.length === 0 && (
              <p className="text-zinc-500 text-sm">검색에서 좋아하는 작품을 추가해보세요.</p>
            )}
          </div>
          {items.length === 0 && (
            <Link
              href="/search"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.97]"
            >
              검색하러 가기
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((e) => (
            <li key={e.id}>
              <EntryCard
                id={e.id}
                title={e.title}
                coverUrl={e.coverUrl}
                status={e.status}
                currentEpisode={e.currentEpisode}
                totalEpisodes={e.totalEpisodes}
                rating={e.rating}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
