import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().cuid('Must be a valid resource id'),
});
export type IdParamDto = z.infer<typeof idParamSchema>;

export const keyParamSchema = z.object({
  key: z.string().min(1).max(200),
});
export type KeyParamDto = z.infer<typeof keyParamSchema>;
