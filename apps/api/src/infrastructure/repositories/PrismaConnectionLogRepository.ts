import type { ConnectionLog as PrismaConnectionLog, Prisma } from '@prisma/client';
import type { ConnectionAction, ConnectionResult } from '@sbm-nac/shared-types';
import type { ConnectionLog } from '../../domain/entities/ConnectionLog';
import type {
  ConnectionLogFilter,
  CreateConnectionLogInput,
  IConnectionLogRepository,
} from '../../domain/repositories/IConnectionLogRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaConnectionLog): ConnectionLog {
  return {
    id: row.id,
    deviceId: row.deviceId,
    ipAddress: row.ipAddress,
    macAddress: row.macAddress,
    action: row.action as ConnectionAction,
    result: row.result as ConnectionResult,
    message: row.message,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

export class PrismaConnectionLogRepository implements IConnectionLogRepository {
  async create(data: CreateConnectionLogInput): Promise<ConnectionLog> {
    const row = await prisma.connectionLog.create({
      data: {
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
        macAddress: data.macAddress,
        action: data.action,
        result: data.result,
        message: data.message ?? null,
      },
    });
    return toDomain(row);
  }

  async findAll(
    pagination: PaginationParams,
    filter?: ConnectionLogFilter,
  ): Promise<PaginatedResult<ConnectionLog>> {
    const { page, pageSize } = pagination;
    const where: Prisma.ConnectionLogWhereInput = {};
    if (filter?.deviceId) where.deviceId = filter.deviceId;
    if (filter?.action) where.action = filter.action;
    if (filter?.result) where.result = filter.result;
    if (filter?.from || filter?.to) {
      where.occurredAt = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
    }
    const [rows, total] = await Promise.all([
      prisma.connectionLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.connectionLog.count({ where }),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await prisma.connectionLog.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    });
    return result.count;
  }
}
