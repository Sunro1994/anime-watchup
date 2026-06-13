import { GraphQLClient } from 'graphql-request'
import { SEARCH_ANIME } from './queries'
import type { SearchResult, AniListMedia } from './types'

const client = new GraphQLClient('https://graphql.anilist.co')

export async function searchAnime(query: string): Promise<AniListMedia[]> {
  if (query.trim().length < 2) return []
  const data = await client.request<SearchResult>(SEARCH_ANIME, { q: query })
  return data.Page.media
}
