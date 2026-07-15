import { z } from 'zod';
import { paginationQuerySchema } from './pagination.dto';

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  hostname: z.string().min(1).max(255),
  ipAddress: z.string().regex(ipv4Regex, 'Must be a valid IPv4 address'),
  location: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});
export type CreateServerDto = z.infer<typeof createServerSchema>;

export const updateServerSchema = createServerSchema.partial();
export type UpdateServerDto = z.infer<typeof updateServerSchema>;

export const serverQuerySchema = paginationQuerySchema;
export type ServerQueryDto = z.infer<typeof serverQuerySchema>;
