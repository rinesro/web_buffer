import type { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';

export interface DeviceSession {
  id: string;
  userId: string;
  fingerprint: string;
  name: string;
  deviceType: DeviceType;
  ipAddress: string;
  status: DeviceStatus;
  lastActivityAt: Date;
  createdAt: Date;
}
