'use client'

import { useEffect, useState, useTransition } from 'react'
import { searchAction, addEntry } from './actions'
import type { AniListMedia } from '@/lib/anilist/types'

export function SearchClient() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AniListMedia[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAction(q)
        setResults(r)
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [q])

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="작품명 검색"
        className="w-full border rounded p-2"
      />
      {pending && <p className="text-sm text-gray-500">검색 중...</p>}
      <ul className="space-y-3">
        {results.map((m) => (
          <li key={m.id} className="flex gap-3 items-center border rounded p-2">
            {m.coverImage.large && (
              <img src={m.coverImage.large} alt="" className="w-12 h-16 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {m.title.english ?? m.title.romaji ?? m.title.native}
              </p>
              <p className="text-xs text-gray-500">
                {m.seasonYear ?? '—'} · {m.format ?? '—'} · {m.episodes ?? '?'}화
              </p>
            </div>
            <form action={async () => { await addEntry(m.id) }}>
              <button className="border rounded px-3 py-1 text-sm">추가</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
