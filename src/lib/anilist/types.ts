export type AniListMedia = {
  id: number
  title: { romaji: string | null; english: string | null; native: string | null }
  coverImage: { large: string | null }
  episodes: number | null
  seasonYear: number | null
  format: string | null
  genres: string[]
}

export type SearchResult = {
  Page: { media: AniListMedia[] }
}
