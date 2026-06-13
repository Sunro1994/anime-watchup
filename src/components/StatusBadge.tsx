import type { EntryStatus } from '@/lib/entries/schema'

const LABEL: Record<EntryStatus, string> = {
  watching: '시청 중',
  completed: '완결',
  on_hold: '보류',
  dropped: '드롭',
  plan_to_watch: '보고 싶음',
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  return <span className="text-xs border rounded px-2 py-0.5">{LABEL[status]}</span>
}

export { LABEL as STATUS_LABEL }
