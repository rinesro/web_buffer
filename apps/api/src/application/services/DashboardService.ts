import type { DeviceStatus } from '@sbm-nac/shared-types';
import type { SystemMetric } from '../../domain/entities/SystemMetric';
import type { IServerRepository } from '../../domain/repositories/IServerRepository';
import type { ISystemMetricRepository } from '../../domain/repositories/ISystemMetricRepository';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export interface DashboardSummary {
  serverCount: number;
  deviceCounts: Record<DeviceStatus, number>;
  latestMetrics: SystemMetric[];
  unreadNotificationCount: number;
}

export class DashboardService {
  constructor(
    private readonly serverRepository: IServerRepository,
    private readonly metricRepository: ISystemMetricRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async getSummary(adminId: string): Promise<DashboardSummary> {
    const [serverCount, deviceCounts, latestMetrics, unreadNotificationCount] = await Promise.all([
      this.serverRepository.count(),
      this.deviceRepository.countByStatus(),
      this.metricRepository.findLatestForAllServers(),
      this.notificationRepository.countUnreadForAdmin(adminId),
    ]);

    return { serverCount, deviceCounts, latestMetrics, unreadNotificationCount };
  }
}
