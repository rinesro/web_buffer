import type { SystemMetric, SystemMetricSample } from '../../domain/entities/SystemMetric';
import type { IServerRepository } from '../../domain/repositories/IServerRepository';
import type { ISystemMetricRepository } from '../../domain/repositories/ISystemMetricRepository';
import { NotFoundError } from '../../shared/errors/AppError';
import { METRIC_HISTORY_DEFAULT_LIMIT } from '../../shared/constants';

export class SystemMetricService {
  constructor(
    private readonly metricRepository: ISystemMetricRepository,
    private readonly serverRepository: IServerRepository,
  ) {}

  async record(serverId: string, sample: SystemMetricSample): Promise<SystemMetric> {
    const server = await this.serverRepository.findById(serverId);
    if (!server) throw new NotFoundError('Server');
    return this.metricRepository.create(serverId, sample);
  }

  async getLatest(serverId: string): Promise<SystemMetric | null> {
    return this.metricRepository.findLatestByServerId(serverId);
  }

  async getHistory(
    serverId: string,
    limit: number = METRIC_HISTORY_DEFAULT_LIMIT,
  ): Promise<SystemMetric[]> {
    return this.metricRepository.findHistoryByServerId(serverId, limit);
  }

  async getLatestForAllServers(): Promise<SystemMetric[]> {
    return this.metricRepository.findLatestForAllServers();
  }
}
