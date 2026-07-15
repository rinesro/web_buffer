import type { SystemMetric, SystemMetricSample } from '../entities/SystemMetric';

export interface ISystemMetricRepository {
  create(serverId: string, sample: SystemMetricSample): Promise<SystemMetric>;
  findLatestByServerId(serverId: string): Promise<SystemMetric | null>;
  findHistoryByServerId(serverId: string, limit: number): Promise<SystemMetric[]>;
  findLatestForAllServers(): Promise<SystemMetric[]>;
  deleteOlderThan(cutoff: Date): Promise<number>;
}
