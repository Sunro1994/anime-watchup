import { describe, it, expect } from 'vitest'
import { SEARCH_ANIME } from '@/lib/anilist/queries'

describe('SEARCH_ANIME query', () => {
  it('search 변수와 type ANIME을 포함한다', () => {
    expect(SEARCH_ANIME).toContain('$q: String!')
    expect(SEARCH_ANIME).toContain('type: ANIME')
    expect(SEARCH_ANIME).toContain('coverImage')
  })
})
