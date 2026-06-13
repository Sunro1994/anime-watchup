import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { AniListMedia } from '@/lib/anilist/types'

export async function upsertAnimeCache(media: AniListMedia) {
  const svc = createServiceClient()
  await svc.from('anime_cache').upsert({
    anilist_id: media.id,
    title_ko: null,
    title_en: media.title.english,
    title_romaji: media.title.romaji,
    cover_url: media.coverImage.large,
    total_episodes: media.episodes,
    season_year: media.seasonYear,
    format: media.format,
    genres: media.genres,
  })
}

export async function addEntryForCurrentUser(userId: string, anilistId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      anilist_id: anilistId,
      status: 'plan_to_watch',
      current_episode: 0,
    })
    .select('id')
    .single()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, entryId: data.id }
}
