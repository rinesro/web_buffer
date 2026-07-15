import type { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  serverId: string | null;
  lastSeenAt: Date | null;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
