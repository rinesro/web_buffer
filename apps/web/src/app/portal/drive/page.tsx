'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DriveExplorer } from '@/features/web-drive/DriveExplorer';
import { API_URL } from '@/lib/api-client';
import { userApiClient } from '@/lib/userApiClient';
import { useUserAuthStore } from '@/store/userAuthStore';

/** fetch with keepalive (not navigator.sendBeacon) because the disconnect call needs a
 *  custom Authorization header, which sendBeacon can't send — keepalive is what lets a
 *  fetch survive the page actually unloading. */
function disconnectBeacon(accessToken: string | null): void {
  if (!accessToken) return;
  void fetch(`${API_URL}/device-sessions/disconnect`, {
    method: 'POST',
    keepalive: true,
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
}

export default function PortalDrivePage() {
  const router = useRouter();
  const accessToken = useUserAuthStore((state) => state.accessToken);

  useEffect(() => {
    const handlePageHide = (): void => disconnectBeacon(useUserAuthStore.getState().accessToken);
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  const handleDisconnect = async (): Promise<void> => {
    try {
      await userApiClient.post('/device-sessions/disconnect');
    } finally {
      router.push('/portal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/portal"
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Your Web Drive</h1>
          <p className="text-sm text-muted-foreground">
            A simulated private drive — folders, file records, and metadata only, visible to no
            other account. Your session here ends automatically after 30 minutes of inactivity, or
            immediately if you disconnect.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleDisconnect()}
          disabled={!accessToken}
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
      <DriveExplorer client={userApiClient} />
    </div>
  );
}
