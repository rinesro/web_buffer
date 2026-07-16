'use client';

import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { NotificationList } from '@/features/notifications/NotificationList';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Notification, Paginated } from '@/types/api';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, error, isLoading, refetch } = useApiQuery<Paginated<Notification>>(
    () => apiClient.get(`/notifications${buildQuery({ page, pageSize: 15, unreadOnly })}`),
    [page, unreadOnly],
  );

  const handleMarkAsRead = async (notification: Notification): Promise<void> => {
    await apiClient.patch(`/notifications/${notification.id}/read`);
    refetch();
  };

  const handleDelete = async (notification: Notification): Promise<void> => {
    await apiClient.delete(`/notifications/${notification.id}`);
    refetch();
  };

  const handleMarkAllRead = async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Threshold alerts and device access changes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={unreadOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setPage(1);
              setUnreadOnly((v) => !v);
            }}
          >
            Unread only
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading notifications" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState title="No notifications" description="Threshold alerts and device status changes will show up here." />
      ) : (
        <>
          <NotificationList
            notifications={data.items}
            onMarkAsRead={(n) => void handleMarkAsRead(n)}
            onDelete={(n) => void handleDelete(n)}
          />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
