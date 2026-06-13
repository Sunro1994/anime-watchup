import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'
import { InviteCopyButton } from './invite-copy-button'

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
    <main className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-zinc-100">내 정보</h1>

      <div className="bg-zinc-900/60 backdrop-blur-sm ring-1 ring-zinc-800 rounded-xl p-4 space-y-1">
        <p className="text-sm text-zinc-400">닉네임</p>
        <p className="text-zinc-100 font-medium">{profile.display_name}</p>
      </div>

      {inviteCode && (
        <section className="bg-zinc-900/60 backdrop-blur-sm ring-1 ring-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-sm text-zinc-400">그룹 초대 코드</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-2xl tracking-widest bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {inviteCode}
            </p>
            <InviteCopyButton code={inviteCode} />
          </div>
          <p className="text-xs text-zinc-500">친구에게 이 코드를 전달하면 같은 그룹에 합류합니다 (M2에서 활성화).</p>
        </section>
      )}

      <form action={signOut}>
        <button className="bg-zinc-900/80 ring-1 ring-zinc-800 hover:bg-rose-500/10 hover:ring-rose-500/40 hover:text-rose-300 text-zinc-300 transition-all rounded-lg px-4 py-2.5">
          로그아웃
        </button>
      </form>
    </main>
  )
}
