'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { searchAction, addEntry } from './actions'
import type { AniListMedia } from '@/lib/anilist/types'

function AddButton({ mediaId }: { mediaId: number }) {
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    startTransition(async () => {
      await addEntry(mediaId)
    })
  }

  return (
    <button
      onClick={handleAdd}
      disabled={pending}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs rounded-lg px-3 py-1.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
    >
      {pending ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          추가 중
        </>
      ) : (
        '추가'
      )}
    </button>
  )
}

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="작품명 검색"
          className="w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-3 pl-10 text-zinc-100 placeholder:text-zinc-500 transition-all"
        />
      </div>

      {pending && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          검색 중
        </div>
      )}

      <ul className="space-y-3">
        {results.map((m) => (
          <li
            key={m.id}
            className="flex gap-3 items-center bg-zinc-900/60 backdrop-blur-sm ring-1 ring-zinc-800 rounded-xl p-3"
          >
            {m.coverImage.large && (
              <img src={m.coverImage.large} alt="" className="w-12 h-16 object-cover rounded-lg ring-1 ring-zinc-800 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-zinc-100">
                {m.title.english ?? m.title.romaji ?? m.title.native}
              </p>
              <p className="text-xs text-zinc-400">
                {m.seasonYear ?? '—'} · {m.format ?? '—'} · {m.episodes ?? '?'}화
              </p>
            </div>
            <AddButton mediaId={m.id} />
          </li>
        ))}
      </ul>
    </div>
  )
}
