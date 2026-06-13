'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchAnime } from '@/lib/anilist/client'
import { upsertAnimeCache, addEntryForCurrentUser } from '@/lib/entries/repository'

export async function searchAction(query: string) {
  return searchAnime(query)
}

export async function addEntry(anilistId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const media = (await searchAnime(`${anilistId}`)).find((m) => m.id === anilistId)
    ?? (await searchAnimeById(anilistId))
  if (!media) return { error: '작품 정보를 찾을 수 없어요.' }

  await upsertAnimeCache(media)
  const r = await addEntryForCurrentUser(user.id, anilistId)
  if (!r.ok) return { error: r.error }
  redirect(`/entries/${r.entryId}`)
}

async function searchAnimeById(id: number) {
  const { GraphQLClient, gql } = await import('graphql-request')
  const client = new GraphQLClient('https://graphql.anilist.co')
  const q = gql`
    query ById($id: Int!) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        seasonYear
        format
        genres
      }
    }
  `
  try {
    const data = await client.request<{ Media: import('@/lib/anilist/types').AniListMedia }>(q, { id })
    return data.Media
  } catch {
    return undefined
  }
}
