'use client'

import { useState, useTransition } from 'react'
import { updateEntry, deleteEntry } from './actions'
import { EpisodeStepper } from '@/components/EpisodeStepper'
import { RatingPicker } from '@/components/RatingPicker'
import { TagInput } from '@/components/TagInput'
import { STATUS_LABEL } from '@/components/StatusBadge'
import { STATUS_VALUES, type EntryStatus } from '@/lib/entries/schema'

type EntryRow = {
  id: string
  status: EntryStatus
  current_episode: number
  rating: number | null
  review: string | null
  tags: string[]
  started_at: string | null
  finished_at: string | null
}

type Props = {
  entry: EntryRow
  totalEpisodes: number | null
}

export function EntryForm({ entry, totalEpisodes }: Props) {
  const [state, setState] = useState(entry)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function patch<K extends keyof EntryRow>(key: K, value: EntryRow[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function save() {
    setSaved(false)
    startTransition(async () => {
      const r = await updateEntry(entry.id, {
        status: state.status,
        current_episode: state.current_episode,
        rating: state.rating,
        review: state.review,
        tags: state.tags,
        started_at: state.started_at,
        finished_at: state.finished_at,
      })
      if (!r.error) setSaved(true)
    })
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">상태</span>
        <select
          value={state.status}
          onChange={(e) => patch('status', e.target.value as EntryStatus)}
          className="mt-1 border rounded p-2 w-full"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium block mb-1">회차 진행도</span>
        <EpisodeStepper
          value={state.current_episode}
          max={totalEpisodes}
          onChange={(v) => patch('current_episode', v)}
        />
      </div>

      <div>
        <span className="text-sm font-medium block mb-1">평점 (1~10)</span>
        <RatingPicker value={state.rating} onChange={(v) => patch('rating', v)} />
      </div>

      <label className="block">
        <span className="text-sm font-medium">한 줄 리뷰 (비공개)</span>
        <textarea
          value={state.review ?? ''}
          onChange={(e) => patch('review', e.target.value || null)}
          className="mt-1 w-full border rounded p-2 min-h-24"
        />
      </label>

      <div>
        <span className="text-sm font-medium block mb-1">태그 (비공개)</span>
        <TagInput value={state.tags} onChange={(v) => patch('tags', v)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium">시작일</span>
          <input
            type="date"
            value={state.started_at ?? ''}
            onChange={(e) => patch('started_at', e.target.value || null)}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">완료일</span>
          <input
            type="date"
            value={state.finished_at ?? ''}
            onChange={(e) => patch('finished_at', e.target.value || null)}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {pending ? '저장 중...' : '저장'}
        </button>
        <form action={async () => { await deleteEntry(entry.id) }}>
          <button className="border border-red-500 text-red-600 rounded p-2 px-4">삭제</button>
        </form>
      </div>

      {saved && <p className="text-green-700 text-sm">저장됨</p>}
    </div>
  )
}
