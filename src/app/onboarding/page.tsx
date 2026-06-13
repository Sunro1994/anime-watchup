'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { saveOnboarding } from './actions'

export default function OnboardingPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function action(formData: FormData) {
    formData.set('mode', mode)
    startTransition(async () => {
      const r = await saveOnboarding(formData)
      if (r?.error) setError(r.error)
    })
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-bold text-zinc-100">시작하기</h1>

        <div className="bg-zinc-900/60 backdrop-blur-sm ring-1 ring-zinc-800 rounded-2xl p-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">닉네임</span>
            <input
              name="display_name"
              required
              className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 placeholder:text-zinc-500 transition-all"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 p-2 rounded-full text-sm font-medium transition-all duration-200 ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50 text-white'
                  : 'bg-zinc-900/50 ring-1 ring-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              그룹 만들기
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 p-2 rounded-full text-sm font-medium transition-all duration-200 ${
                mode === 'join'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/50 text-white'
                  : 'bg-zinc-900/50 ring-1 ring-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              초대 코드로 참가
            </button>
          </div>

          {mode === 'create' ? (
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">그룹 이름 (선택)</span>
              <input
                name="group_name"
                className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 placeholder:text-zinc-500 transition-all"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">초대 코드 (6자리)</span>
              <input
                name="invite_code"
                required
                maxLength={6}
                className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 placeholder:text-zinc-500 uppercase tracking-widest transition-all"
              />
            </label>
          )}
        </div>

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
            '시작'
          )}
        </button>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
      </form>
    </main>
  )
}
