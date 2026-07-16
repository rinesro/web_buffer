'use client';

import { useState } from 'react';
import { Ban, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Feedback';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/api-client';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { DeviceSessionDetail, DeviceSessionSummary } from '@/types/api';
import type { DeviceStatus } from '@sbm-nac/shared-types';

const STATUS_TONE: Record<DeviceStatus, 'success' | 'danger' | 'warning'> = {
  ALLOWED: 'success',
  BLOCKED: 'danger',
  PENDING: 'warning',
};

interface DeviceSessionTableProps {
  sessions: DeviceSessionSummary[];
  onAllow: (session: DeviceSessionSummary) => void;
  onBlock: (session: DeviceSessionSummary) => void;
}

export function DeviceSessionTable({ sessions, onAllow, onBlock }: DeviceSessionTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Device name</TableHeaderCell>
            <TableHeaderCell>Username</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Last active</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">{session.name}</TableCell>
              <TableCell className="text-muted-foreground">{session.userName}</TableCell>
              <TableCell className="text-muted-foreground">{session.deviceType}</TableCell>
              <TableCell>
                <Badge tone={STATUS_TONE[session.status]}>{session.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeTime(session.lastActivityAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View details"
                    onClick={() => setDetailId(session.id)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  {session.status !== 'ALLOWED' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Allow ${session.name}`}
                      onClick={() => onAllow(session)}
                      className="hover:text-success"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Block ${session.name}`}
                    onClick={() => onBlock(session)}
                    className="hover:text-danger"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SessionDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

function SessionDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: detail, isLoading } = useApiQuery<DeviceSessionDetail | null>(
    () => (id ? apiClient.get(`/device-sessions/${id}`) : Promise.resolve(null)),
    [id],
  );

  return (
    <Modal isOpen={id !== null} onClose={onClose} title="Session details">
      {isLoading ? (
        <Spinner label="Loading" />
      ) : detail ? (
        <div className="space-y-3 text-sm">
          <Detail label="Device name" value={detail.name} />
          <Detail label="Username" value={`${detail.userName} (${detail.userEmail})`} />
          <Detail label="IP address" value={detail.ipAddress} mono />
          <Detail label="Fingerprint" value={detail.fingerprint} mono />
          <Detail label="First seen" value={formatDateTime(detail.createdAt)} />
          <Detail label="Last active" value={formatDateTime(detail.lastActivityAt)} />
        </div>
      ) : null}
    </Modal>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? 'font-data mt-0.5 text-foreground' : 'mt-0.5 text-foreground'}>
        {value}
      </p>
    </div>
  );
}
