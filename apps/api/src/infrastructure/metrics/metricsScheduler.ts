import { NotificationSeverity, NotificationType, ServerStatus } from '@sbm-nac/shared-types';
import type { SystemMetric } from '../../domain/entities/SystemMetric';
import type { IServerRepository } from '../../domain/repositories/IServerRepository';
import type { SystemMetricService } from '../../application/services/SystemMetricService';
import type { NotificationService } from '../../application/services/NotificationService';
import type { SettingService } from '../../application/services/SettingService';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import type { AppSocketIOServer } from './socketGateway';
import { SystemMetricsCollector } from './systemMetricsCollector';

const DEFAULT_CPU_ALERT_THRESHOLD = 90;
const DEFAULT_RAM_ALERT_THRESHOLD = 90;
const DEFAULT_DISK_ALERT_THRESHOLD = 90;
const DEFAULT_BUFFER_ALERT_THRESHOLD = 90;

interface Thresholds {
  cpu: number;
  ram: number;
  disk: number;
  buffer: number;
}

export class MetricsScheduler {
  private readonly collector = new SystemMetricsCollector();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly io: AppSocketIOServer,
    private readonly systemMetricService: SystemMetricService,
    private readonly serverRepository: IServerRepository,
    private readonly notificationService: NotificationService,
    private readonly settingService: SettingService,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch((error: unknown) => {
        logger.error({ error }, 'Metrics collection tick failed');
      });
    }, config.metricSampleIntervalMs);
    logger.info({ intervalMs: config.metricSampleIntervalMs }, 'Metrics scheduler started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    const { items: servers } = await this.serverRepository.findAll({ page: 1, pageSize: 1000 });
    if (servers.length === 0) return;

    const [sample, thresholds] = await Promise.all([
      this.collector.sample(),
      this.loadThresholds(),
    ]);

    for (const server of servers) {
      const metric = await this.systemMetricService.record(server.id, sample);
      await this.serverRepository.updateStatus(server.id, ServerStatus.ONLINE, new Date());

      this.io.to(`server:${server.id}`).emit('metric', metric);

      await this.checkThresholds(server.id, server.name, metric, thresholds);
    }
  }

  private async loadThresholds(): Promise<Thresholds> {
    const [cpu, ram, disk, buffer] = await Promise.all([
      this.getThreshold('alert.cpu.threshold', DEFAULT_CPU_ALERT_THRESHOLD),
      this.getThreshold('alert.ram.threshold', DEFAULT_RAM_ALERT_THRESHOLD),
      this.getThreshold('alert.disk.threshold', DEFAULT_DISK_ALERT_THRESHOLD),
      this.getThreshold('alert.buffer.threshold', DEFAULT_BUFFER_ALERT_THRESHOLD),
    ]);
    return { cpu, ram, disk, buffer };
  }

  private async getThreshold(key: string, fallback: number): Promise<number> {
    try {
      const setting = await this.settingService.getByKey(key);
      const parsed = Number(setting.value);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private async checkThresholds(
    serverId: string,
    serverName: string,
    metric: SystemMetric,
    thresholds: Thresholds,
  ): Promise<void> {
    const breaches: string[] = [];
    if (metric.cpuUsagePercent >= thresholds.cpu) breaches.push(`CPU ${metric.cpuUsagePercent}%`);
    if (metric.ramUsagePercent >= thresholds.ram) breaches.push(`RAM ${metric.ramUsagePercent}%`);
    if (metric.diskUsagePercent >= thresholds.disk) breaches.push(`disk ${metric.diskUsagePercent}%`);
    if (metric.bufferUsagePercent >= thresholds.buffer) {
      breaches.push(`buffer ${metric.bufferUsagePercent}%`);
    }

    if (breaches.length === 0) return;

    const notification = await this.notificationService.create({
      adminId: null,
      type: NotificationType.THRESHOLD_EXCEEDED,
      severity: NotificationSeverity.CRITICAL,
      title: `${serverName}: resource threshold exceeded`,
      message: `Elevated usage detected: ${breaches.join(', ')}`,
      metadata: JSON.stringify({ serverId }),
    });

    this.io.emit('notification', notification);
  }
}
