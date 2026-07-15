import type { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';
import type { DeviceSession } from '../entities/DeviceSession';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateDeviceSessionInput {
  userId: string;
  fingerprint: string;
  name: string;
  deviceType: DeviceType;
  ipAddress: string;
}

export interface IDeviceSessionRepository {
  findByUserAndFingerprint(userId: string, fingerprint: string): Promise<DeviceSession | null>;
  findById(id: string): Promise<DeviceSession | null>;
  findAllByUser(userId: string): Promise<DeviceSession[]>;
  findAll(pagination: PaginationParams): Promise<PaginatedResult<DeviceSession>>;
  create(data: CreateDeviceSessionInput): Promise<DeviceSession>;
  touchActivity(id: string, ipAddress: string): Promise<void>;
  updateStatus(id: string, status: DeviceStatus): Promise<DeviceSession>;
  delete(id: string): Promise<void>;
  /** Deletes every session whose lastActivityAt is older than the given cutoff; returns how many. */
  deleteInactiveSince(cutoff: Date): Promise<number>;
}
