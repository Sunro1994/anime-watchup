import { requireUser } from '@/lib/auth/require-user'
import { BottomNav } from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <div className="min-h-dvh pb-16">
      {children}
      <BottomNav />
    </div>
  )
}
