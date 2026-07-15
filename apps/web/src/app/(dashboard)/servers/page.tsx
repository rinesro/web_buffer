'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { ServerFormModal } from '@/features/servers/ServerFormModal';
import { ServerTable } from '@/features/servers/ServerTable';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError, buildQuery } from '@/lib/api-client';
import type { Paginated, Server } from '@/types/api';

export default function ServersPage() {
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<Server | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, error, isLoading, refetch } = useApiQuery<Paginated<Server>>(
    () => apiClient.get(`/servers${buildQuery({ page, pageSize: 10 })}`),
    [page],
  );

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/servers/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this server.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Servers</h1>
          <p className="text-sm text-muted-foreground">Hosts registered to receive live resource monitoring.</p>
        </div>
        <Button onClick={() => setFormTarget(null)}>
          <Plus className="h-4 w-4" />
          Add server
        </Button>
      </div>

      {isLoading ? (
        <Spinner label="Loading servers" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          title="No servers yet"
          description="Add your first server to begin collecting CPU, RAM, disk, and buffer samples."
          action={<Button onClick={() => setFormTarget(null)}>Add server</Button>}
        />
      ) : (
        <>
          <ServerTable servers={data.items} onEdit={setFormTarget} onDelete={setDeleteTarget} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      <ServerFormModal
        isOpen={formTarget !== undefined}
        server={formTarget}
        onClose={() => setFormTarget(undefined)}
        onSuccess={refetch}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete server"
        description={
          deleteError ??
          `This removes "${deleteTarget?.name}" and its recorded metric history. This cannot be undone.`
        }
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
