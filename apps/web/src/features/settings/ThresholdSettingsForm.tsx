'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField, Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Feedback';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Setting } from '@/types/api';

const THRESHOLD_FIELDS = [
  { key: 'alert.cpu.threshold', label: 'CPU usage threshold', defaultValue: '90' },
  { key: 'alert.ram.threshold', label: 'RAM usage threshold', defaultValue: '90' },
  { key: 'alert.disk.threshold', label: 'Disk usage threshold', defaultValue: '90' },
  { key: 'alert.buffer.threshold', label: 'Buffer usage threshold', defaultValue: '90' },
] as const;

export function ThresholdSettingsForm() {
  const { data: settings, isLoading, refetch } = useApiQuery<Setting[]>(() => apiClient.get('/settings'));

  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));
    setValues((prev) => {
      const next = { ...prev };
      for (const field of THRESHOLD_FIELDS) {
        if (next[field.key] === undefined) {
          next[field.key] = byKey.get(field.key) ?? field.defaultValue;
        }
      }
      return next;
    });
  }, [settings]);

  const handleSave = async (key: string): Promise<void> => {
    setError(null);
    setSavedKey(null);
    setSavingKey(key);
    try {
      await apiClient.put(`/settings/${key}`, { value: values[key] });
      setSavedKey(key);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this threshold.');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) return <Spinner label="Loading settings" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert thresholds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          When usage on a server reaches or exceeds a threshold, a critical notification is
          raised automatically — no redeploy needed to change these.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {THRESHOLD_FIELDS.map((field) => (
            <FormField key={field.key} label={field.label} htmlFor={field.key}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.key}
                    type="number"
                    min={1}
                    max={100}
                    className="font-data pr-8"
                    value={values[field.key] ?? field.defaultValue}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={savingKey === field.key}
                  onClick={() => void handleSave(field.key)}
                >
                  {savedKey === field.key ? 'Saved' : 'Save'}
                </Button>
              </div>
            </FormField>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
