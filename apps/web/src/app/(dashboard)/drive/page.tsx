import { DriveExplorer } from '@/features/web-drive/DriveExplorer';

export default function DrivePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Web Drive</h1>
        <p className="text-sm text-muted-foreground">
          A simulated shared drive scoped to your account — folders, file records, and metadata only.
        </p>
      </div>
      <DriveExplorer />
    </div>
  );
}
