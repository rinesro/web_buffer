'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { BlockedFingerprintTable } from '@/features/device-sessions/BlockedFingerprintTable';
import { DeviceSessionTable } from '@/features/device-sessions/DeviceSessionTable';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError, buildQuery } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { BlockedFingerprint, DeviceSessionSummary, Paginated } from '@/types/api';

type Tab = 'active' | 'blocked';

export default function DeviceSessionsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [page, setPage] = useState(1);
  const [blockTarget, setBlockTarget] = useState<DeviceSessionSummary | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlockedFingerprint | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: sessionPage,
    error: sessionError,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useApiQuery<Paginated<DeviceSessionSummary>>(
    () => apiClient.get(`/device-sessions${buildQuery({ page, pageSize: 10 })}`),
    [page, tab],
  );

  const {
    data: blockedPage,
    error: blockedError,
    isLoading: isBlockedLoading,
    refetch: refetchBlocked,
  } = useApiQuery<Paginated<BlockedFingerprint>>(
    () => apiClient.get(`/device-sessions/blocked${buildQuery({ page, pageSize: 10 })}`),
    [page, tab],
  );

  const handleAllow = async (session: DeviceSessionSummary): Promise<void> => {
    setMutationError(null);
    try {
      await apiClient.patch(`/device-sessions/${session.id}/allow`);
      refetchSessions();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not allow this session.');
    }
  };

  const handleBlock = async (): Promise<void> => {
    if (!blockTarget) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      await apiClient.post(`/device-sessions/${blockTarget.id}/block`);
      setBlockTarget(null);
      refetchSessions();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not block this session.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnblock = async (): Promise<void> => {
    if (!unblockTarget) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      await apiClient.delete(`/device-sessions/blocked/${unblockTarget.id}`);
      setUnblockTarget(null);
      refetchBlocked();
    } catch (err) {
      setMutationError(
        err instanceof ApiError ? err.message : 'Could not unblock this fingerprint.',
      );
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Device sessions</h1>
        <p className="text-sm text-muted-foreground">
          Active sessions are temporary — they clear automatically after 30 minutes of inactivity or
          when the user disconnects. Blocking one locks the account out entirely and remembers the
          device permanently.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['active', 'blocked'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium capitalize',
              tab === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {value === 'active' ? 'Active sessions' : 'Blocked devices'}
          </button>
        ))}
      </div>

      {mutationError ? <p className="text-sm text-danger">{mutationError}</p> : null}

      {tab === 'active' ? (
        isSessionsLoading ? (
          <Spinner label="Loading sessions" />
        ) : sessionError ? (
          <ErrorState message={sessionError} onRetry={refetchSessions} />
        ) : !sessionPage?.items.length ? (
          <EmptyState
            title="No active sessions"
            description="Sessions appear here once a user signs in from a browser."
          />
        ) : (
          <>
            <DeviceSessionTable
              sessions={sessionPage.items}
              onAllow={(s) => void handleAllow(s)}
              onBlock={setBlockTarget}
            />
            <Pagination
              page={sessionPage.page}
              totalPages={sessionPage.totalPages}
              total={sessionPage.total}
              pageSize={sessionPage.pageSize}
              onPageChange={setPage}
            />
          </>
        )
      ) : isBlockedLoading ? (
        <Spinner label="Loading blocklist" />
      ) : blockedError ? (
        <ErrorState message={blockedError} onRetry={refetchBlocked} />
      ) : !blockedPage?.items.length ? (
        <EmptyState
          title="No blocked devices"
          description="Devices you block show up here permanently."
        />
      ) : (
        <>
          <BlockedFingerprintTable entries={blockedPage.items} onUnblock={setUnblockTarget} />
          <Pagination
            page={blockedPage.page}
            totalPages={blockedPage.totalPages}
            total={blockedPage.total}
            pageSize={blockedPage.pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={blockTarget !== null}
        title="Block this device"
        description={`This blocks "${blockTarget?.name}" permanently and locks the account of ${blockTarget?.userName} entirely — not just this one session.`}
        confirmLabel="Block"
        isConfirming={isMutating}
        onConfirm={() => void handleBlock()}
        onCancel={() => setBlockTarget(null)}
      />

      <ConfirmDialog
        isOpen={unblockTarget !== null}
        title="Unblock this device"
        description="This removes the permanent block on this fingerprint. It does not automatically unlock the associated account — that is a separate step."
        confirmLabel="Unblock"
        isConfirming={isMutating}
        onConfirm={() => void handleUnblock()}
        onCancel={() => setUnblockTarget(null)}
      />
    </div>
  );
}
