import { Prisma } from '@prisma/client';
import type { Notification } from '../../domain/entities/Notification';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import type {
  CreateNotificationInput,
  INotificationRepository,
} from '../../domain/repositories/INotificationRepository';
import { NotFoundError } from '../../shared/errors/AppError';

const PRISMA_RECORD_NOT_FOUND = 'P2025';

export class NotificationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async listForAdmin(
    adminId: string,
    pagination: PaginationParams,
    unreadOnly: boolean,
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationRepository.findAllForAdmin(adminId, pagination, unreadOnly);
  }

  async countUnread(adminId: string): Promise<number> {
    return this.notificationRepository.countUnreadForAdmin(adminId);
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    return this.notificationRepository.create(data);
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      return await this.notificationRepository.markAsRead(id);
    } catch (error) {
      throwMappedNotFound(error, 'Notification');
    }
  }

  async markAllAsRead(adminId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(adminId);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.notificationRepository.delete(id);
    } catch (error) {
      throwMappedNotFound(error, 'Notification');
    }
  }
}

function throwMappedNotFound(error: unknown, resource: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_RECORD_NOT_FOUND
  ) {
    throw new NotFoundError(resource);
  }
  throw error;
}
