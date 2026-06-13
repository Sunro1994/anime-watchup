'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createGroupForUser, joinGroupByCode } from '@/lib/groups/repository'

async function getAuthedUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  return user.id
}

export async function saveOnboarding(formData: FormData) {
  const userId = await getAuthedUserId()
  const displayName = String(formData.get('display_name') ?? '').trim()
  const mode = String(formData.get('mode') ?? '')

  if (displayName.length < 1) return { error: '닉네임을 입력해주세요.' }

  const svc = createServiceClient()
  await svc.from('users').update({ display_name: displayName }).eq('id', userId)

  if (mode === 'create') {
    const groupName = String(formData.get('group_name') ?? '').trim() || `${displayName}의 그룹`
    const r = await createGroupForUser(userId, groupName)
    if (!r.ok) return { error: r.error }
  } else if (mode === 'join') {
    const code = String(formData.get('invite_code') ?? '').trim().toUpperCase()
    const r = await joinGroupByCode(userId, code)
    if (!r.ok) return { error: r.error }
  }

  redirect('/list')
}
