import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, group_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.display_name) {
    redirect('/onboarding')
  }

  return { user, profile, supabase }
}
