import { gql } from 'graphql-request'

export const SEARCH_ANIME = gql`
  query SearchAnime($q: String!, $perPage: Int = 10) {
    Page(perPage: $perPage) {
      media(search: $q, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        seasonYear
        format
        genres
      }
    }
  }
`
