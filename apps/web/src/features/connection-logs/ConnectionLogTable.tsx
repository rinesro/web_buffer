'use client';

import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { formatDateTime } from '@/lib/utils';
import type { ConnectionLog } from '@/types/api';
import type { ConnectionAction, ConnectionResult } from '@sbm-nac/shared-types';

const ACTION_TONE: Record<ConnectionAction, 'success' | 'danger' | 'neutral' | 'warning'> = {
  CONNECT: 'success',
  DISCONNECT: 'neutral',
  ALLOWED: 'success',
  BLOCKED: 'danger',
  ACCESS_ATTEMPT: 'warning',
};

const RESULT_TONE: Record<ConnectionResult, 'success' | 'danger'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
};

export function ConnectionLogTable({ logs }: { logs: ConnectionLog[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>When</TableHeaderCell>
          <TableHeaderCell>IP address</TableHeaderCell>
          <TableHeaderCell>MAC address</TableHeaderCell>
          <TableHeaderCell>Action</TableHeaderCell>
          <TableHeaderCell>Result</TableHeaderCell>
          <TableHeaderCell>Message</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-data whitespace-nowrap text-muted-foreground">
              {formatDateTime(log.occurredAt)}
            </TableCell>
            <TableCell className="font-data">{log.ipAddress}</TableCell>
            <TableCell className="font-data text-muted-foreground">{log.macAddress}</TableCell>
            <TableCell>
              <Badge tone={ACTION_TONE[log.action]}>{log.action}</Badge>
            </TableCell>
            <TableCell>
              <Badge tone={RESULT_TONE[log.result]}>{log.result}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">{log.message ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
