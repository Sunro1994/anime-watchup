'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { sendMagicLink } from './actions'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error' | 'verifying'>('idle')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) return

    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return

    setStatus('verifying')
    setMessage('로그인 처리 중...')

    const supabase = createClient()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setStatus('error')
        setMessage(`세션 설정 실패: ${error.message}`)
        return
      }
      window.location.replace('/')
    })
  }, [])

  function action(formData: FormData) {
    startTransition(async () => {
      const r = await sendMagicLink(formData)
      if (r?.error) {
        setStatus('error')
        setMessage(r.error)
      } else {
        setStatus('sent')
        setMessage('메일함을 확인해주세요.')
      }
    })
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            anime-watchup
          </h1>
          <p className="text-sm text-zinc-400">이메일로 로그인 링크를 받으세요.</p>
        </div>

        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-3 text-zinc-100 placeholder:text-zinc-500 transition-all"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 rounded-lg p-3 font-medium transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              처리 중
            </span>
          ) : (
            '매직 링크 받기'
          )}
        </button>

        {status !== 'idle' && (
          <p
            className={
              status === 'sent' || status === 'verifying'
                ? 'text-emerald-400 text-sm'
                : 'text-rose-400 text-sm'
            }
          >
            {message}
          </p>
        )}
      </form>
    </main>
  )
}
