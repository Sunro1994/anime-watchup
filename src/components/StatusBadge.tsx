import type { EntryStatus } from '@/lib/entries/schema'

const LABEL: Record<EntryStatus, string> = {
  watching: '시청 중',
  completed: '완결',
  on_hold: '보류',
  dropped: '드롭',
  plan_to_watch: '보고 싶음',
}

const STATUS_CLASS: Record<EntryStatus, string> = {
  watching: 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  on_hold: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  dropped: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  plan_to_watch: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_CLASS[status]}`}>
      {LABEL[status]}
    </span>
  )
}

export { LABEL as STATUS_LABEL }
