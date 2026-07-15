import { z } from 'zod';
import { paginationQuerySchema } from './pagination.dto';

export const notificationQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});
export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;
