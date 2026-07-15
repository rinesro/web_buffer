import type { NotificationSeverity, NotificationType } from '@sbm-nac/shared-types';

export interface Notification {
  id: string;
  adminId: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata: string | null;
  isRead: boolean;
  createdAt: Date;
}
