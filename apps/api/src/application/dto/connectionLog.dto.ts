import { z } from 'zod';
import { ConnectionAction, ConnectionResult } from '@sbm-nac/shared-types';
import { paginationQuerySchema } from './pagination.dto';

export const connectionLogQuerySchema = paginationQuerySchema.extend({
  deviceId: z.string().cuid().optional(),
  action: z.nativeEnum(ConnectionAction).optional(),
  result: z.nativeEnum(ConnectionResult).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ConnectionLogQueryDto = z.infer<typeof connectionLogQuerySchema>;
