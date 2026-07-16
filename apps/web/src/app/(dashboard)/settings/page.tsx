'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ThresholdSettingsForm } from '@/features/settings/ThresholdSettingsForm';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';

export default function SettingsPage() {
  const admin = useAuthStore((state) => state.admin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, alert thresholds, and appearance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Detail label="Name" value={admin?.name ?? '—'} />
          <Detail label="Email" value={admin?.email ?? '—'} />
          <Detail label="Role" value={admin?.role ?? '—'} />
          <Detail label="Last sign in" value={admin?.lastLoginAt ? formatDateTime(admin.lastLoginAt) : '—'} />
        </CardContent>
      </Card>

      <ThresholdSettingsForm />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-data mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
