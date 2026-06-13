'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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

  function patch<K extends keyof EntryRow>(key: K, value: EntryRow[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function save() {
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
      if (r.error) {
        toast.error(r.error)
      } else {
        toast.success('저장됨')
      }
    })
  }

  function handleDelete() {
    if (!window.confirm('정말 삭제할까요?')) return
    startTransition(async () => {
      await deleteEntry(entry.id)
    })
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-300">상태</span>
        <select
          value={state.status}
          onChange={(e) => patch('status', e.target.value as EntryStatus)}
          className="mt-1.5 bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 w-full text-zinc-100 transition-all"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium text-zinc-300 block mb-1.5">회차 진행도</span>
        <EpisodeStepper
          value={state.current_episode}
          max={totalEpisodes}
          onChange={(v) => patch('current_episode', v)}
        />
      </div>

      <div>
        <span className="text-sm font-medium text-zinc-300 block mb-1.5">평점 (1~10)</span>
        <RatingPicker value={state.rating} onChange={(v) => patch('rating', v)} />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-300">한 줄 리뷰 (비공개)</span>
        <textarea
          value={state.review ?? ''}
          onChange={(e) => patch('review', e.target.value || null)}
          className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 placeholder:text-zinc-500 min-h-24 transition-all resize-none"
        />
      </label>

      <div>
        <span className="text-sm font-medium text-zinc-300 block mb-1.5">태그 (비공개)</span>
        <TagInput value={state.tags} onChange={(v) => patch('tags', v)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">시작일</span>
          <input
            type="date"
            value={state.started_at ?? ''}
            onChange={(e) => patch('started_at', e.target.value || null)}
            className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 transition-all"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">완료일</span>
          <input
            type="date"
            value={state.finished_at ?? ''}
            onChange={(e) => patch('finished_at', e.target.value || null)}
            className="mt-1.5 w-full bg-zinc-900/80 ring-1 ring-zinc-800 focus:ring-2 focus:ring-purple-500/60 focus:outline-none rounded-lg p-2.5 text-zinc-100 transition-all"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 rounded-lg p-2.5 font-medium transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중
            </span>
          ) : (
            '저장'
          )}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all rounded-lg px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
