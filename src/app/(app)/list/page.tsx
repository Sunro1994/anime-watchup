import Link from 'next/link'
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

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">내 목록</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === 'all' ? '/list' : `/list?status=${t.value}`}
            className={`whitespace-nowrap text-sm rounded-full border px-3 py-1 ${
              status === t.value ? 'bg-black text-white' : ''
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {(entries ?? []).length === 0 ? (
        <p className="text-gray-500 text-sm">
          아직 등록한 작품이 없어요. <Link href="/search" className="underline">검색</Link>에서 추가해보세요.
        </p>
      ) : (
        <ul className="space-y-2">
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
