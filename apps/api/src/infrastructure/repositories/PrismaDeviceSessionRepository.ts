import type { DeviceSession as PrismaDeviceSession } from '@prisma/client';
import type { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';
import type { DeviceSession } from '../../domain/entities/DeviceSession';
import type {
  CreateDeviceSessionInput,
  IDeviceSessionRepository,
} from '../../domain/repositories/IDeviceSessionRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaDeviceSession): DeviceSession {
  return {
    id: row.id,
    userId: row.userId,
    fingerprint: row.fingerprint,
    name: row.name,
    deviceType: row.deviceType as DeviceType,
    ipAddress: row.ipAddress,
    status: row.status as DeviceStatus,
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
  };
}

export class PrismaDeviceSessionRepository implements IDeviceSessionRepository {
  async findByUserAndFingerprint(
    userId: string,
    fingerprint: string,
  ): Promise<DeviceSession | null> {
    const row = await prisma.deviceSession.findFirst({ where: { userId, fingerprint } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<DeviceSession | null> {
    const row = await prisma.deviceSession.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findAllByUser(userId: string): Promise<DeviceSession[]> {
    const rows = await prisma.deviceSession.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' },
    });
    return rows.map(toDomain);
  }

  async findAll(pagination: PaginationParams): Promise<PaginatedResult<DeviceSession>> {
    const { page, pageSize } = pagination;
    const [rows, total] = await Promise.all([
      prisma.deviceSession.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastActivityAt: 'desc' },
      }),
      prisma.deviceSession.count(),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(data: CreateDeviceSessionInput): Promise<DeviceSession> {
    const row = await prisma.deviceSession.create({ data });
    return toDomain(row);
  }

  async touchActivity(id: string, ipAddress: string): Promise<void> {
    await prisma.deviceSession.update({
      where: { id },
      data: { ipAddress, lastActivityAt: new Date() },
    });
  }

  async updateStatus(id: string, status: DeviceStatus): Promise<DeviceSession> {
    const row = await prisma.deviceSession.update({ where: { id }, data: { status } });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.deviceSession.delete({ where: { id } });
  }

  async deleteInactiveSince(cutoff: Date): Promise<number> {
    const result = await prisma.deviceSession.deleteMany({
      where: { lastActivityAt: { lt: cutoff } },
    });
    return result.count;
  }
}
