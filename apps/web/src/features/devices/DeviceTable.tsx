'use client';

import { Ban, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import type { Device } from '@/types/api';
import type { DeviceStatus } from '@sbm-nac/shared-types';

const STATUS_TONE: Record<DeviceStatus, 'success' | 'danger' | 'warning'> = {
  ALLOWED: 'success',
  BLOCKED: 'danger',
  PENDING: 'warning',
};

interface DeviceTableProps {
  devices: Device[];
  onSetStatus: (device: Device, status: DeviceStatus) => void;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
}

export function DeviceTable({ devices, onSetStatus, onEdit, onDelete }: DeviceTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>IP address</TableHeaderCell>
          <TableHeaderCell>MAC address</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Last seen</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell className="font-medium">{device.name}</TableCell>
            <TableCell className="font-data">{device.ipAddress}</TableCell>
            <TableCell className="font-data text-muted-foreground">{device.macAddress}</TableCell>
            <TableCell className="text-muted-foreground">{device.deviceType}</TableCell>
            <TableCell>
              <Badge tone={STATUS_TONE[device.status]}>{device.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {device.lastSeenAt ? formatRelativeTime(device.lastSeenAt) : 'Never'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {device.status !== 'ALLOWED' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Allow ${device.name}`}
                    onClick={() => onSetStatus(device, 'ALLOWED' as DeviceStatus)}
                    className="hover:text-success"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : null}
                {device.status !== 'BLOCKED' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Block ${device.name}`}
                    onClick={() => onSetStatus(device, 'BLOCKED' as DeviceStatus)}
                    className="hover:text-danger"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button variant="ghost" size="icon" aria-label={`Edit ${device.name}`} onClick={() => onEdit(device)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${device.name}`}
                  onClick={() => onDelete(device)}
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
