'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatPercent } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

interface LiveMetricCardProps {
  label: string;
  value: number | null;
  history: number[];
  tone?: Tone;
}

const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const TONE_STROKE: Record<Tone, string> = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--danger))',
};

function toneForValue(value: number | null): Tone {
  if (value === null) return 'primary';
  if (value >= 90) return 'danger';
  if (value >= 75) return 'warning';
  return 'success';
}

export function LiveMetricCard({ label, value, history, tone }: LiveMetricCardProps) {
  const resolvedTone = tone ?? toneForValue(value);
  const chartData = history.map((point, index) => ({ index, value: point }));

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('font-data text-3xl font-semibold', TONE_TEXT[resolvedTone])}>
          {value === null ? '—' : formatPercent(value)}
        </p>
        <div className="mt-3 h-12">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis domain={[0, 100]} hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={TONE_STROKE[resolvedTone]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center text-xs text-muted-foreground">
              Waiting for data...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
