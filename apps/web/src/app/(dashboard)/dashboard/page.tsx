'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Input';
import { LiveMetricCard } from '@/features/dashboard/LiveMetricCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { DashboardSummary, Paginated, Server, SystemMetric } from '@/types/api';

export default function DashboardPage() {
  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useApiQuery<DashboardSummary>(() => apiClient.get('/dashboard/summary'));

  const { data: serverPage, isLoading: isServersLoading } = useApiQuery<Paginated<Server>>(() =>
    apiClient.get(`/servers${buildQuery({ page: 1, pageSize: 50 })}`),
  );

  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedServerId && serverPage?.items.length) {
      setSelectedServerId(serverPage.items[0]?.id ?? null);
    }
  }, [serverPage, selectedServerId]);

  const { data: seedHistory } = useApiQuery<SystemMetric[]>(
    () =>
      selectedServerId
        ? apiClient.get(`/servers/${selectedServerId}/metrics/history${buildQuery({ limit: 60 })}`)
        : Promise.resolve([]),
    [selectedServerId],
  );

  const { history, isConnected } = useLiveMetrics(selectedServerId, seedHistory ?? []);

  if (isSummaryLoading || isServersLoading) return <Spinner label="Loading dashboard" />;
  if (summaryError) return <ErrorState message={summaryError} onRetry={refetchSummary} />;
  if (!summary) return null;

  const chartData = history.map((metric) => ({
    time: new Date(metric.recordedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    CPU: metric.cpuUsagePercent,
    RAM: metric.ramUsagePercent,
    Buffer: metric.bufferUsagePercent,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Servers monitored" value={summary.serverCount} />
        <StatCard label="Devices allowed" value={summary.deviceCounts.ALLOWED} tone="success" />
        <StatCard label="Devices blocked" value={summary.deviceCounts.BLOCKED} tone="danger" />
        <StatCard label="Unread notifications" value={summary.unreadNotificationCount} tone="primary" />
      </div>

      {!serverPage?.items.length ? (
        <EmptyState
          title="No servers registered yet"
          description="Add a server to start collecting live CPU, RAM, disk, and buffer metrics."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Live metrics for</span>
              <Select
                className="w-56"
                value={selectedServerId ?? ''}
                onChange={(event) => setSelectedServerId(event.target.value)}
              >
                {serverPage.items.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.ipAddress})
                  </option>
                ))}
              </Select>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'}`}
                aria-hidden="true"
              />
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <LiveMetricCard
              label="CPU usage"
              value={history.at(-1)?.cpuUsagePercent ?? null}
              history={history.map((m) => m.cpuUsagePercent)}
            />
            <LiveMetricCard
              label="RAM usage"
              value={history.at(-1)?.ramUsagePercent ?? null}
              history={history.map((m) => m.ramUsagePercent)}
            />
            <LiveMetricCard
              label="Disk usage"
              value={history.at(-1)?.diskUsagePercent ?? null}
              history={history.map((m) => m.diskUsagePercent)}
            />
            <LiveMetricCard
              label="Buffer usage"
              value={history.at(-1)?.bufferUsagePercent ?? null}
              history={history.map((m) => m.bufferUsagePercent)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CPU / RAM / Buffer over time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="time" fontSize={11} className="font-data" tickMargin={8} minTickGap={40} />
                      <YAxis domain={[0, 100]} fontSize={11} className="font-data" width={36} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="CPU" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} isAnimationActive={false} />
                      <Line type="monotone" dataKey="RAM" stroke="hsl(var(--warning))" dot={false} strokeWidth={2} isAnimationActive={false} />
                      <Line type="monotone" dataKey="Buffer" stroke="hsl(var(--success))" dot={false} strokeWidth={2} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Collecting samples — the chart fills in as they arrive.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: number;
  tone?: 'primary' | 'success' | 'danger';
}) {
  const toneClass = { primary: 'text-primary', success: 'text-success', danger: 'text-danger' }[tone];
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`font-data mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
