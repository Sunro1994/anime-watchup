import { z } from 'zod'

export const STATUS_VALUES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const

export const EntryStatusSchema = z.enum(STATUS_VALUES)
export type EntryStatus = z.infer<typeof EntryStatusSchema>

export const EntryUpdateSchema = z
  .object({
    status: EntryStatusSchema.optional(),
    current_episode: z.number().int().min(0).optional(),
    rating: z.number().int().min(1).max(10).nullable().optional(),
    review: z.string().max(5000).nullable().optional(),
    tags: z.array(z.string().min(1).max(30)).max(20).optional(),
    started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    finished_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .strict()

export type EntryUpdateInput = z.infer<typeof EntryUpdateSchema>
