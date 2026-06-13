'use client'

import { useState } from 'react'
import { saveOnboarding } from './actions'

export default function OnboardingPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')

  async function action(formData: FormData) {
    formData.set('mode', mode)
    const r = await saveOnboarding(formData)
    if (r?.error) setError(r.error)
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">시작하기</h1>

        <label className="block">
          <span className="text-sm">닉네임</span>
          <input
            name="display_name"
            required
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 p-2 rounded border ${mode === 'create' ? 'bg-black text-white' : ''}`}
          >
            그룹 만들기
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 p-2 rounded border ${mode === 'join' ? 'bg-black text-white' : ''}`}
          >
            초대 코드로 참가
          </button>
        </div>

        {mode === 'create' ? (
          <label className="block">
            <span className="text-sm">그룹 이름 (선택)</span>
            <input name="group_name" className="mt-1 w-full border rounded p-2" />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm">초대 코드 (6자리)</span>
            <input
              name="invite_code"
              required
              maxLength={6}
              className="mt-1 w-full border rounded p-2 uppercase tracking-widest"
            />
          </label>
        )}

        <button type="submit" className="w-full bg-black text-white rounded p-2">
          시작
        </button>

        {error && <p className="text-red-700 text-sm">{error}</p>}
      </form>
    </main>
  )
}
