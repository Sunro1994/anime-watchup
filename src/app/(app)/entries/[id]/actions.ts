'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryUpdateSchema } from '@/lib/entries/schema'

export async function updateEntry(entryId: string, raw: unknown) {
  const parsed = EntryUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = await createClient()
  const { error } = await supabase.from('entries').update(parsed.data).eq('id', entryId)
  if (error) return { error: error.message }

  revalidatePath(`/entries/${entryId}`)
  revalidatePath('/list')
  return { ok: true }
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('entries').delete().eq('id', entryId)
  if (error) return { error: error.message }
  redirect('/list')
}
