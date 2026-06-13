import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'
import { ListView, type ListItem } from './ListView'

const VALID_STATUSES = new Set<string>(['all', ...STATUS_VALUES])

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { user } = await requireUser()
  const { status: rawStatus } = await searchParams
  const initialStatus = (
    rawStatus && VALID_STATUSES.has(rawStatus) ? rawStatus : 'all'
  ) as EntryStatus | 'all'

  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('entries')
    .select('id, status, current_episode, rating, anilist_id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const ids = (entries ?? []).map((e) => e.anilist_id)
  const { data: animes } = await supabase
    .from('anime_cache')
    .select('anilist_id, title_en, title_romaji, cover_url, total_episodes')
    .in('anilist_id', ids.length ? ids : [0])

  const animeById = new Map((animes ?? []).map((a) => [a.anilist_id, a]))
  const items: ListItem[] = (entries ?? []).map((e) => {
    const a = animeById.get(e.anilist_id)
    return {
      id: e.id,
      status: e.status as EntryStatus,
      currentEpisode: e.current_episode,
      rating: e.rating,
      title: a?.title_en ?? a?.title_romaji ?? '—',
      coverUrl: a?.cover_url ?? null,
      totalEpisodes: a?.total_episodes ?? null,
    }
  })

  return <ListView items={items} initialStatus={initialStatus} />
}
