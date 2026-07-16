import type { Notification as PrismaNotification } from '@prisma/client';
import type { NotificationSeverity, NotificationType } from '@sbm-nac/shared-types';
import type { Notification } from '../../domain/entities/Notification';
import type {
  CreateNotificationInput,
  INotificationRepository,
} from '../../domain/repositories/INotificationRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaNotification): Notification {
  return {
    id: row.id,
    adminId: row.adminId,
    type: row.type as NotificationType,
    severity: row.severity as NotificationSeverity,
    title: row.title,
    message: row.message,
    metadata: row.metadata,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationInput): Promise<Notification> {
    const row = await prisma.notification.create({
      data: {
        adminId: data.adminId ?? null,
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? null,
      },
    });
    return toDomain(row);
  }

  async findAllForAdmin(
    adminId: string,
    pagination: PaginationParams,
    unreadOnly = false,
  ): Promise<PaginatedResult<Notification>> {
    const { page, pageSize } = pagination;
    const where = {
      OR: [{ adminId }, { adminId: null }],
      ...(unreadOnly ? { isRead: false } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async countUnreadForAdmin(adminId: string): Promise<number> {
    return prisma.notification.count({
      where: { OR: [{ adminId }, { adminId: null }], isRead: false },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    const row = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return toDomain(row);
  }

  async markAllAsRead(adminId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { OR: [{ adminId }, { adminId: null }], isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }
}
