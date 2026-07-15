import type { DeviceStatus } from '@sbm-nac/shared-types';
import type { Device } from '../entities/Device';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateDeviceInput {
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: Device['deviceType'];
  serverId?: string | null;
}

export type UpdateDeviceInput = Partial<Omit<CreateDeviceInput, 'macAddress'>>;

export interface DeviceFilter {
  status?: DeviceStatus;
  search?: string;
}

export interface IDeviceRepository {
  findAll(pagination: PaginationParams, filter?: DeviceFilter): Promise<PaginatedResult<Device>>;
  findById(id: string): Promise<Device | null>;
  findByMacAddress(macAddress: string): Promise<Device | null>;
  create(data: CreateDeviceInput): Promise<Device>;
  update(id: string, data: UpdateDeviceInput): Promise<Device>;
  updateStatus(id: string, status: DeviceStatus): Promise<Device>;
  updateLastSeen(id: string, ipAddress: string, lastSeenAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
  countByStatus(): Promise<Record<DeviceStatus, number>>;
}
