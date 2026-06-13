import { createServiceClient } from '@/lib/supabase/service'
import { generateInviteCode } from './invite-code'

export async function createGroupForUser(userId: string, groupName: string) {
  const svc = createServiceClient()

  // 최대 5회 코드 재시도
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode()
    const { data: group, error } = await svc
      .from('groups')
      .insert({ name: groupName, invite_code: code, created_by: userId })
      .select('id, invite_code')
      .single()

    if (!error && group) {
      await svc.from('users').update({ group_id: group.id }).eq('id', userId)
      return { ok: true as const, group }
    }
    if (error?.code !== '23505') return { ok: false as const, error: error?.message ?? 'unknown' }
  }
  return { ok: false as const, error: 'invite code collision' }
}

export async function joinGroupByCode(userId: string, code: string) {
  const svc = createServiceClient()
  const { data: group } = await svc.from('groups').select('id').eq('invite_code', code).single()
  if (!group) return { ok: false as const, error: '초대 코드를 찾을 수 없어요.' }
  await svc.from('users').update({ group_id: group.id }).eq('id', userId)
  return { ok: true as const, groupId: group.id }
}
