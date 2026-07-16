'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Cable,
  HardDrive,
  LayoutDashboard,
  ScrollText,
  Server,
  Settings,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/servers', label: 'Servers', icon: Server },
  { href: '/devices', label: 'Devices', icon: Wifi },
  { href: '/sessions', label: 'Device sessions', icon: Users },
  { href: '/connection-logs', label: 'Connection logs', icon: ScrollText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/drive', label: 'Web Drive', icon: HardDrive },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

interface SidebarProps {
  /** Mobile drawer mode: renders as a fixed overlay with a close affordance. */
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-60 shrink-0 flex-col border-r border-border bg-card',
        mobile ? 'fixed inset-y-0 left-0 z-50 flex shadow-xl' : 'hidden md:flex',
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Cable className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">SBM-NAC</span>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
