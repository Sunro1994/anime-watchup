import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryForm } from './entry-form'
import type { EntryStatus } from '@/lib/entries/schema'

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('entries')
    .select('id, status, current_episode, rating, review, tags, started_at, finished_at, anilist_id')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const { data: anime } = await supabase
    .from('anime_cache')
    .select('title_en, title_romaji, cover_url, total_episodes')
    .eq('anilist_id', entry.anilist_id)
    .single()

  const title = anime?.title_en ?? anime?.title_romaji ?? '—'

  return (
    <main className="p-4 space-y-4 pb-24">
      <div className="flex gap-3 items-start">
        {anime?.cover_url && (
          <img
            src={anime.cover_url}
            alt=""
            className="w-20 h-28 object-cover rounded-xl ring-1 ring-zinc-800 shrink-0"
          />
        )}
        <h1 className="text-xl font-bold text-zinc-100 flex-1">{title}</h1>
      </div>

      <EntryForm
        entry={{
          id: entry.id,
          status: entry.status as EntryStatus,
          current_episode: entry.current_episode,
          rating: entry.rating,
          review: entry.review,
          tags: entry.tags,
          started_at: entry.started_at,
          finished_at: entry.finished_at,
        }}
        totalEpisodes={anime?.total_episodes ?? null}
      />
    </main>
  )
}
