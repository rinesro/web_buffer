import type { ConnectionAction, ConnectionResult } from '@sbm-nac/shared-types';

export interface ConnectionLog {
  id: string;
  deviceId: string;
  ipAddress: string;
  macAddress: string;
  action: ConnectionAction;
  result: ConnectionResult;
  message: string | null;
  occurredAt: Date;
  createdAt: Date;
}
