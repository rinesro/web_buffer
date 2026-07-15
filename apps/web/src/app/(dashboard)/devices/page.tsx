'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DeviceStatus } from '@sbm-nac/shared-types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { DeviceFormModal } from '@/features/devices/DeviceFormModal';
import { DeviceTable } from '@/features/devices/DeviceTable';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError, buildQuery } from '@/lib/api-client';
import type { Device, Paginated } from '@/types/api';

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | ''>('');
  const [formTarget, setFormTarget] = useState<Device | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, error, isLoading, refetch } = useApiQuery<Paginated<Device>>(
    () =>
      apiClient.get(
        `/devices${buildQuery({ page, pageSize: 10, search: search || undefined, status: statusFilter || undefined })}`,
      ),
    [page, search, statusFilter],
  );

  const handleSetStatus = async (device: Device, status: DeviceStatus): Promise<void> => {
    setMutationError(null);
    try {
      await apiClient.patch(`/devices/${device.id}/status`, { status });
      refetch();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not update device status.');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      await apiClient.delete(`/devices/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not delete this device.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Devices</h1>
          <p className="text-sm text-muted-foreground">Register devices and control network access by allow/block.</p>
        </div>
        <Button onClick={() => setFormTarget(null)}>
          <Plus className="h-4 w-4" />
          Register device
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, IP, or MAC..."
          className="max-w-xs"
        />
        <Select
          className="max-w-[10rem]"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as DeviceStatus | '');
          }}
        >
          <option value="">All statuses</option>
          {Object.values(DeviceStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>

      {mutationError ? <p className="text-sm text-danger">{mutationError}</p> : null}

      {isLoading ? (
        <Spinner label="Loading devices" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          title="No devices found"
          description="Register a device to start tracking its connection activity."
          action={<Button onClick={() => setFormTarget(null)}>Register device</Button>}
        />
      ) : (
        <>
          <DeviceTable
            devices={data.items}
            onSetStatus={(device, status) => void handleSetStatus(device, status)}
            onEdit={setFormTarget}
            onDelete={setDeleteTarget}
          />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        </>
      )}

      <DeviceFormModal
        isOpen={formTarget !== undefined}
        device={formTarget}
        onClose={() => setFormTarget(undefined)}
        onSuccess={refetch}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete device"
        description={`This removes "${deleteTarget?.name}" and its connection log history. This cannot be undone.`}
        isConfirming={isMutating}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
