'use client';

import { useState } from 'react';
import { ConnectionAction, ConnectionResult } from '@sbm-nac/shared-types';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { FormField, Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConnectionLogTable } from '@/features/connection-logs/ConnectionLogTable';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { ConnectionLog, Paginated } from '@/types/api';

export default function ConnectionLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ConnectionAction | ''>('');
  const [resultFilter, setResultFilter] = useState<ConnectionResult | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, error, isLoading, refetch } = useApiQuery<Paginated<ConnectionLog>>(
    () =>
      apiClient.get(
        `/connection-logs${buildQuery({
          page,
          pageSize: 20,
          action: actionFilter || undefined,
          result: resultFilter || undefined,
          // Sent as end-of-day local time so "to" is inclusive of the whole selected day.
          from: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
          to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
        })}`,
      ),
    [page, actionFilter, resultFilter, fromDate, toDate],
  );

  const clearDateRange = (): void => {
    setPage(1);
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Connection logs</h1>
        <p className="text-sm text-muted-foreground">Audit trail of every device connection, block, and access attempt.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="max-w-[12rem]"
          value={actionFilter}
          onChange={(e) => {
            setPage(1);
            setActionFilter(e.target.value as ConnectionAction | '');
          }}
        >
          <option value="">All actions</option>
          {Object.values(ConnectionAction).map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-[10rem]"
          value={resultFilter}
          onChange={(e) => {
            setPage(1);
            setResultFilter(e.target.value as ConnectionResult | '');
          }}
        >
          <option value="">All results</option>
          {Object.values(ConnectionResult).map((result) => (
            <option key={result} value={result}>
              {result}
            </option>
          ))}
        </Select>
        <FormField label="From" htmlFor="from-date">
          <Input
            id="from-date"
            type="date"
            className="font-data"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setPage(1);
              setFromDate(e.target.value);
            }}
          />
        </FormField>
        <FormField label="To" htmlFor="to-date">
          <Input
            id="to-date"
            type="date"
            className="font-data"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setPage(1);
              setToDate(e.target.value);
            }}
          />
        </FormField>
        {fromDate || toDate ? (
          <button type="button" onClick={clearDateRange} className="mb-0.5 text-sm text-primary hover:underline">
            Clear dates
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <Spinner label="Loading connection logs" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState title="No connection activity yet" description="Entries appear as devices register, connect, or get blocked." />
      ) : (
        <>
          <ConnectionLogTable logs={data.items} />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
