import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export default async function MePage() {
  const { profile } = await requireUser()
  const supabase = await createClient()

  let inviteCode: string | null = null
  if (profile.group_id) {
    const { data: group } = await supabase
      .from('groups')
      .select('invite_code, name')
      .eq('id', profile.group_id)
      .single()
    inviteCode = group?.invite_code ?? null
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-lg font-bold">내 정보</h1>
      <p>닉네임: <strong>{profile.display_name}</strong></p>

      {inviteCode && (
        <section className="border rounded p-3 space-y-1">
          <p className="text-sm text-gray-600">그룹 초대 코드</p>
          <p className="font-mono text-2xl tracking-widest">{inviteCode}</p>
          <p className="text-xs text-gray-500">친구에게 이 코드를 전달하면 같은 그룹에 합류합니다 (M2에서 활성화).</p>
        </section>
      )}

      <form action={signOut}>
        <button className="border rounded p-2 px-4">로그아웃</button>
      </form>
    </main>
  )
}
