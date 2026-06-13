import Link from 'next/link'
import { Tv } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'
import { EntryCard } from '@/components/EntryCard'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'
import { STATUS_LABEL } from '@/components/StatusBadge'

const TABS: { value: EntryStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  ...STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
]

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { user } = await requireUser()
  const { status: rawStatus } = await searchParams
  const status = (TABS.some((t) => t.value === rawStatus) ? rawStatus : 'all') as
    | EntryStatus
    | 'all'

  const supabase = await createClient()
  let query = supabase
    .from('entries')
    .select('id, status, current_episode, rating, anilist_id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)

  const { data: entries } = await query

  const ids = (entries ?? []).map((e) => e.anilist_id)
  const { data: animes } = await supabase
    .from('anime_cache')
    .select('anilist_id, title_en, title_romaji, cover_url, total_episodes')
    .in('anilist_id', ids.length ? ids : [0])

  const animeById = new Map((animes ?? []).map((a) => [a.anilist_id, a]))
  const count = (entries ?? []).length

  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-zinc-100">내 목록</h1>
        {count > 0 && <p className="text-sm text-zinc-400">작품 {count}개</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === 'all' ? '/list' : `/list?status=${t.value}`}
            className={`whitespace-nowrap text-sm rounded-full px-3 py-1 transition-all duration-200 ${
              status === t.value
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50 text-white'
                : 'bg-zinc-900/50 ring-1 ring-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Tv className="w-12 h-12 text-zinc-600" />
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">아직 등록한 작품이 없어요</p>
            <p className="text-zinc-500 text-sm">검색에서 좋아하는 작품을 추가해보세요.</p>
          </div>
          <Link
            href="/search"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.97]"
          >
            검색하러 가기
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {(entries ?? []).map((e) => {
            const a = animeById.get(e.anilist_id)
            return (
              <li key={e.id}>
                <EntryCard
                  id={e.id}
                  title={a?.title_en ?? a?.title_romaji ?? '—'}
                  coverUrl={a?.cover_url ?? null}
                  status={e.status as EntryStatus}
                  currentEpisode={e.current_episode}
                  totalEpisodes={a?.total_episodes ?? null}
                  rating={e.rating}
                />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
