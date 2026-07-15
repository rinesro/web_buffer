'use client';

import Link from 'next/link';
import { HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { useApiQuery } from '@/hooks/useApiQuery';
import { userApiClient } from '@/lib/userApiClient';
import { formatRelativeTime } from '@/lib/utils';
import { useUserAuthStore } from '@/store/userAuthStore';
import type { DeviceSession } from '@/types/api';
import type { DeviceStatus } from '@sbm-nac/shared-types';

const STATUS_TONE: Record<DeviceStatus, 'success' | 'danger' | 'warning'> = {
  ALLOWED: 'success',
  BLOCKED: 'danger',
  PENDING: 'warning',
};

const STATUS_MESSAGE: Record<DeviceStatus, string> = {
  ALLOWED: 'This device has been approved — you can use the Web Drive.',
  PENDING: 'Waiting on an administrator to review and approve this device.',
  BLOCKED: 'This device has been blocked.',
};

export default function PortalHomePage() {
  const user = useUserAuthStore((state) => state.user);
  const {
    data: session,
    error,
    isLoading,
  } = useApiQuery<DeviceSession | null>(() => userApiClient.get('/device-sessions/mine'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Your current device was captured automatically when you signed in — nobody typed this in
          for you. It stays on record only while you&apos;re active; 30 minutes of inactivity or
          leaving the Web Drive clears it.
        </p>
      </div>

      {isLoading ? (
        <Spinner label="Checking your device" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !session ? (
        <p className="text-sm text-muted-foreground">
          No active device session — it may have expired. Sign in again to re-establish one.
        </p>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{session.name}</p>
                <Badge tone={STATUS_TONE[session.status]}>{session.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{STATUS_MESSAGE[session.status]}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              Active {formatRelativeTime(session.lastActivityAt)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Web Drive</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href="/portal/drive"
            className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-4 hover:bg-muted"
          >
            <HardDrive className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Open your Web Drive</p>
              <p className="text-xs text-muted-foreground">
                {session?.status === 'ALLOWED'
                  ? 'Your own private folder space, separate from every other account.'
                  : 'Available once an administrator approves this device.'}
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
