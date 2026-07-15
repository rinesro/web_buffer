import type { Notification } from '../entities/Notification';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateNotificationInput {
  adminId?: string | null;
  type: Notification['type'];
  severity: Notification['severity'];
  title: string;
  message: string;
  metadata?: string | null;
}

export interface INotificationRepository {
  create(data: CreateNotificationInput): Promise<Notification>;
  findAllForAdmin(
    adminId: string,
    pagination: PaginationParams,
    unreadOnly?: boolean,
  ): Promise<PaginatedResult<Notification>>;
  countUnreadForAdmin(adminId: string): Promise<number>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(adminId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
