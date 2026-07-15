import type { ConnectionLog } from '../entities/ConnectionLog';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateConnectionLogInput {
  deviceId: string;
  ipAddress: string;
  macAddress: string;
  action: ConnectionLog['action'];
  result: ConnectionLog['result'];
  message?: string | null;
}

export interface ConnectionLogFilter {
  deviceId?: string;
  action?: ConnectionLog['action'];
  result?: ConnectionLog['result'];
  from?: Date;
  to?: Date;
}

export interface IConnectionLogRepository {
  create(data: CreateConnectionLogInput): Promise<ConnectionLog>;
  findAll(
    pagination: PaginationParams,
    filter?: ConnectionLogFilter,
  ): Promise<PaginatedResult<ConnectionLog>>;
  deleteOlderThan(cutoff: Date): Promise<number>;
}
