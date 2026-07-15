'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import type { Server } from '@/types/api';
import type { ServerStatus } from '@sbm-nac/shared-types';

const STATUS_TONE: Record<ServerStatus, 'success' | 'neutral' | 'danger'> = {
  ONLINE: 'success',
  OFFLINE: 'danger',
  UNKNOWN: 'neutral',
};

interface ServerTableProps {
  servers: Server[];
  onEdit: (server: Server) => void;
  onDelete: (server: Server) => void;
}

export function ServerTable({ servers, onEdit, onDelete }: ServerTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Hostname</TableHeaderCell>
          <TableHeaderCell>IP address</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Last ping</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {servers.map((server) => (
          <TableRow key={server.id}>
            <TableCell className="font-medium">
              <Link href={`/servers/${server.id}`} className="hover:text-primary hover:underline">
                {server.name}
              </Link>
            </TableCell>
            <TableCell className="font-data text-muted-foreground">{server.hostname}</TableCell>
            <TableCell className="font-data">{server.ipAddress}</TableCell>
            <TableCell>
              <Badge tone={STATUS_TONE[server.status]}>{server.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {server.lastPingAt ? formatRelativeTime(server.lastPingAt) : 'Never'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" aria-label={`Edit ${server.name}`} onClick={() => onEdit(server)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${server.name}`}
                  onClick={() => onDelete(server)}
                  className="hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
