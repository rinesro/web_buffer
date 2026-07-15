import type { SystemMetric as PrismaSystemMetric } from '@prisma/client';
import type { SystemMetric, SystemMetricSample } from '../../domain/entities/SystemMetric';
import type { ISystemMetricRepository } from '../../domain/repositories/ISystemMetricRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaSystemMetric): SystemMetric {
  return {
    id: row.id,
    serverId: row.serverId,
    cpuUsagePercent: row.cpuUsagePercent,
    ramUsagePercent: row.ramUsagePercent,
    ramUsedMb: row.ramUsedMb,
    ramTotalMb: row.ramTotalMb,
    diskUsagePercent: row.diskUsagePercent,
    diskUsedGb: row.diskUsedGb,
    diskTotalGb: row.diskTotalGb,
    bufferUsagePercent: row.bufferUsagePercent,
    bufferUsedMb: row.bufferUsedMb,
    bufferTotalMb: row.bufferTotalMb,
    recordedAt: row.recordedAt,
    createdAt: row.createdAt,
  };
}

export class PrismaSystemMetricRepository implements ISystemMetricRepository {
  async create(serverId: string, sample: SystemMetricSample): Promise<SystemMetric> {
    const row = await prisma.systemMetric.create({
      data: { serverId, ...sample },
    });
    return toDomain(row);
  }

  async findLatestByServerId(serverId: string): Promise<SystemMetric | null> {
    const row = await prisma.systemMetric.findFirst({
      where: { serverId },
      orderBy: { recordedAt: 'desc' },
    });
    return row ? toDomain(row) : null;
  }

  async findHistoryByServerId(serverId: string, limit: number): Promise<SystemMetric[]> {
    const rows = await prisma.systemMetric.findMany({
      where: { serverId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return rows.map(toDomain).reverse();
  }

  async findLatestForAllServers(): Promise<SystemMetric[]> {
    const servers: Array<{ id: string }> = await prisma.server.findMany({
      select: { id: true },
    });
    const latest = await Promise.all(
      servers.map((server: { id: string }) =>
        prisma.systemMetric.findFirst({
          where: { serverId: server.id },
          orderBy: { recordedAt: 'desc' },
        }),
      ),
    );
    return latest.filter((row): row is PrismaSystemMetric => row !== null).map(toDomain);
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await prisma.systemMetric.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
    return result.count;
  }
}
