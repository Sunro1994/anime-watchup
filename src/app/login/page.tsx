'use client'

import { useEffect, useState } from 'react'
import { sendMagicLink } from './actions'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error' | 'verifying'>('idle')
  const [message, setMessage] = useState('')

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

  async function action(formData: FormData) {
    const r = await sendMagicLink(formData)
    if (r?.error) {
      setStatus('error')
      setMessage(r.error)
    } else {
      setStatus('sent')
      setMessage('메일함을 확인해주세요.')
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">anime-watchup</h1>
        <p className="text-sm text-gray-600">이메일로 로그인 링크를 받으세요.</p>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full border rounded p-2"
        />
        <button type="submit" className="w-full bg-black text-white rounded p-2">
          매직 링크 받기
        </button>
        {status !== 'idle' && (
          <p
            className={
              status === 'sent' || status === 'verifying' ? 'text-green-700' : 'text-red-700'
            }
          >
            {message}
          </p>
        )}
      </form>
    </main>
  )
}
