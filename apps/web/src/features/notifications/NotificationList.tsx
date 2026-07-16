'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types/api';
import type { NotificationSeverity } from '@sbm-nac/shared-types';

const SEVERITY_TONE: Record<NotificationSeverity, 'primary' | 'warning' | 'danger'> = {
  INFO: 'primary',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}

export function NotificationList({ notifications, onMarkAsRead, onDelete }: NotificationListProps) {
  return (
    <ul className="divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={cn('flex items-start gap-3 p-4', !notification.isRead && 'bg-primary/5')}
        >
          <Badge tone={SEVERITY_TONE[notification.severity]} className="mt-0.5 shrink-0">
            {notification.severity}
          </Badge>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">{notification.title}</p>
              {!notification.isRead ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
            <p className="font-data mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)} · {notification.type}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!notification.isRead ? (
              <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification)}>
                Mark read
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete notification"
              onClick={() => onDelete(notification)}
              className="hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
