import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '@/lib/groups/invite-code'

describe('generateInviteCode', () => {
  it('6자리 영숫자 대문자 문자열을 만든다', () => {
    const code = generateInviteCode()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('호출마다 다른 값을 만든다 (충돌 확률 무시)', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateInviteCode()))
    expect(codes.size).toBeGreaterThan(995)
  })
})
