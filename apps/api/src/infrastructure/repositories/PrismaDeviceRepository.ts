import type { Device as PrismaDevice, Prisma } from '@prisma/client';
import type { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';
import type { Device } from '../../domain/entities/Device';
import type {
  CreateDeviceInput,
  DeviceFilter,
  IDeviceRepository,
  UpdateDeviceInput,
} from '../../domain/repositories/IDeviceRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaDevice): Device {
  return {
    id: row.id,
    name: row.name,
    ipAddress: row.ipAddress,
    macAddress: row.macAddress,
    deviceType: row.deviceType as DeviceType,
    status: row.status as DeviceStatus,
    serverId: row.serverId,
    lastSeenAt: row.lastSeenAt,
    registeredAt: row.registeredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const ALL_DEVICE_STATUSES: DeviceStatus[] = ['ALLOWED', 'BLOCKED', 'PENDING'];

export class PrismaDeviceRepository implements IDeviceRepository {
  async findAll(
    pagination: PaginationParams,
    filter?: DeviceFilter,
  ): Promise<PaginatedResult<Device>> {
    const { page, pageSize } = pagination;
    const where: Prisma.DeviceWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { ipAddress: { contains: filter.search } },
        { macAddress: { contains: filter.search } },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { registeredAt: 'desc' },
      }),
      prisma.device.count({ where }),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(id: string): Promise<Device | null> {
    const row = await prisma.device.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByMacAddress(macAddress: string): Promise<Device | null> {
    const row = await prisma.device.findUnique({ where: { macAddress } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateDeviceInput): Promise<Device> {
    const row = await prisma.device.create({
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        macAddress: data.macAddress,
        deviceType: data.deviceType,
        serverId: data.serverId ?? null,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateDeviceInput): Promise<Device> {
    const row = await prisma.device.update({ where: { id }, data });
    return toDomain(row);
  }

  async updateStatus(id: string, status: DeviceStatus): Promise<Device> {
    const row = await prisma.device.update({ where: { id }, data: { status } });
    return toDomain(row);
  }

  async updateLastSeen(id: string, ipAddress: string, lastSeenAt: Date): Promise<void> {
    await prisma.device.update({ where: { id }, data: { ipAddress, lastSeenAt } });
  }

  async delete(id: string): Promise<void> {
    await prisma.device.delete({ where: { id } });
  }

  async countByStatus(): Promise<Record<DeviceStatus, number>> {
    const rows = await prisma.device.groupBy({ by: ['status'], _count: { status: true } });
    const result = Object.fromEntries(
      ALL_DEVICE_STATUSES.map((status) => [status, 0]),
    ) as Record<DeviceStatus, number>;
    for (const row of rows) {
      result[row.status as DeviceStatus] = row._count.status;
    }
    return result;
  }
}
