import type { Server } from '../entities/Server';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateServerInput {
  name: string;
  hostname: string;
  ipAddress: string;
  location?: string | null;
  description?: string | null;
}

export type UpdateServerInput = Partial<CreateServerInput>;

export interface IServerRepository {
  findAll(pagination: PaginationParams): Promise<PaginatedResult<Server>>;
  findById(id: string): Promise<Server | null>;
  findByIpAddress(ipAddress: string): Promise<Server | null>;
  create(data: CreateServerInput): Promise<Server>;
  update(id: string, data: UpdateServerInput): Promise<Server>;
  updateStatus(id: string, status: Server['status'], lastPingAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
