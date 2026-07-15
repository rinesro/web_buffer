import type { ServerStatus } from '@sbm-nac/shared-types';

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  location: string | null;
  description: string | null;
  status: ServerStatus;
  lastPingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
