'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {isMobileNavOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <Sidebar mobile onClose={() => setIsMobileNavOpen(false)} />
        </>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
