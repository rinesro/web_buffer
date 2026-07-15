'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { LiveMetricCard } from '@/features/dashboard/LiveMetricCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { apiClient, buildQuery } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { Server, SystemMetric } from '@/types/api';
import type { ServerStatus } from '@sbm-nac/shared-types';

const STATUS_TONE: Record<ServerStatus, 'success' | 'neutral' | 'danger'> = {
  ONLINE: 'success',
  OFFLINE: 'danger',
  UNKNOWN: 'neutral',
};

export default function ServerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const serverId = params.id;

  const { data: server, error, isLoading } = useApiQuery<Server>(
    () => apiClient.get(`/servers/${serverId}`),
    [serverId],
  );
  const { data: seedHistory } = useApiQuery<SystemMetric[]>(
    () => apiClient.get(`/servers/${serverId}/metrics/history${buildQuery({ limit: 60 })}`),
    [serverId],
  );
  const { history, isConnected } = useLiveMetrics(serverId, seedHistory ?? []);

  if (isLoading) return <Spinner label="Loading server" />;
  if (error || !server) return <ErrorState message={error ?? 'Server not found'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/servers')} aria-label="Back to servers">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{server.name}</h1>
            <Badge tone={STATUS_TONE[server.status]}>{server.status}</Badge>
          </div>
          <p className="font-data text-sm text-muted-foreground">
            {server.hostname} · {server.ipAddress}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'}`} aria-hidden="true" />
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LiveMetricCard label="CPU usage" value={history.at(-1)?.cpuUsagePercent ?? null} history={history.map((m) => m.cpuUsagePercent)} />
        <LiveMetricCard label="RAM usage" value={history.at(-1)?.ramUsagePercent ?? null} history={history.map((m) => m.ramUsagePercent)} />
        <LiveMetricCard label="Disk usage" value={history.at(-1)?.diskUsagePercent ?? null} history={history.map((m) => m.diskUsagePercent)} />
        <LiveMetricCard label="Buffer usage" value={history.at(-1)?.bufferUsagePercent ?? null} history={history.map((m) => m.bufferUsagePercent)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Detail label="Location" value={server.location ?? '—'} />
          <Detail label="Last ping" value={server.lastPingAt ? formatDateTime(server.lastPingAt) : 'Never'} />
          <Detail label="Registered" value={formatDateTime(server.createdAt)} />
          <Detail label="Description" value={server.description ?? '—'} />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
