import type { Server as PrismaServer } from '@prisma/client';
import type { ServerStatus } from '@sbm-nac/shared-types';
import type { Server } from '../../domain/entities/Server';
import type {
  CreateServerInput,
  IServerRepository,
  UpdateServerInput,
} from '../../domain/repositories/IServerRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaServer): Server {
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    ipAddress: row.ipAddress,
    location: row.location,
    description: row.description,
    status: row.status as ServerStatus,
    lastPingAt: row.lastPingAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaServerRepository implements IServerRepository {
  async findAll(pagination: PaginationParams): Promise<PaginatedResult<Server>> {
    const { page, pageSize } = pagination;
    const [rows, total] = await Promise.all([
      prisma.server.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.server.count(),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(id: string): Promise<Server | null> {
    const row = await prisma.server.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByIpAddress(ipAddress: string): Promise<Server | null> {
    const row = await prisma.server.findUnique({ where: { ipAddress } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateServerInput): Promise<Server> {
    const row = await prisma.server.create({
      data: {
        name: data.name,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        location: data.location ?? null,
        description: data.description ?? null,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateServerInput): Promise<Server> {
    const row = await prisma.server.update({ where: { id }, data });
    return toDomain(row);
  }

  async updateStatus(id: string, status: Server['status'], lastPingAt: Date): Promise<void> {
    await prisma.server.update({ where: { id }, data: { status, lastPingAt } });
  }

  async delete(id: string): Promise<void> {
    await prisma.server.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return prisma.server.count();
  }
}
