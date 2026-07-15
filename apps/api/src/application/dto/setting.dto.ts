import { z } from 'zod';

export const upsertSettingSchema = z.object({
  value: z.string().min(1),
  description: z.string().max(500).optional(),
});
export type UpsertSettingDto = z.infer<typeof upsertSettingSchema>;
