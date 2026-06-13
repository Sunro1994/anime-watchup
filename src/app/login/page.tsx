'use client'

import { useState } from 'react'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

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
          <p className={status === 'sent' ? 'text-green-700' : 'text-red-700'}>{message}</p>
        )}
      </form>
    </main>
  )
}
