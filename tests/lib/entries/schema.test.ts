import { describe, it, expect } from 'vitest'
import { EntryUpdateSchema } from '@/lib/entries/schema'

describe('EntryUpdateSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    const r = EntryUpdateSchema.safeParse({
      status: 'watching',
      current_episode: 5,
      rating: 8,
      review: '재밌음',
      tags: ['action', 'shounen'],
      started_at: '2026-06-13',
      finished_at: null,
    })
    expect(r.success).toBe(true)
  })

  it('잘못된 status를 거부한다', () => {
    const r = EntryUpdateSchema.safeParse({ status: 'unknown' })
    expect(r.success).toBe(false)
  })

  it('rating 범위 밖을 거부한다', () => {
    expect(EntryUpdateSchema.safeParse({ rating: 0 }).success).toBe(false)
    expect(EntryUpdateSchema.safeParse({ rating: 11 }).success).toBe(false)
  })

  it('current_episode 음수를 거부한다', () => {
    expect(EntryUpdateSchema.safeParse({ current_episode: -1 }).success).toBe(false)
  })
})
