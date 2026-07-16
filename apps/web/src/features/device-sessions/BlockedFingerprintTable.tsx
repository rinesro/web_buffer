'use client';

import { Ban, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { formatDateTime, truncateMiddle } from '@/lib/utils';
import type { BlockedFingerprint } from '@/types/api';

interface BlockedFingerprintTableProps {
  entries: BlockedFingerprint[];
  onUnblock: (entry: BlockedFingerprint) => void;
}

export function BlockedFingerprintTable({ entries, onUnblock }: BlockedFingerprintTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Fingerprint</TableHeaderCell>
          <TableHeaderCell>Reason</TableHeaderCell>
          <TableHeaderCell>Blocked at</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-data flex items-center gap-2 text-danger">
              <Ban className="h-4 w-4" aria-hidden="true" />
              {truncateMiddle(entry.fingerprint, 24)}
            </TableCell>
            <TableCell className="text-muted-foreground">{entry.reason ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(entry.blockedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onUnblock(entry)}>
                <Undo2 className="h-4 w-4" />
                Unblock
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
