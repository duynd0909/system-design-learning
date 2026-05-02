'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, Database, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Role } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/problems', label: 'Problems', icon: Database, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== Role.ADMIN) {
      void router.push('/login');
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady || !isAuthenticated || user?.role !== Role.ADMIN) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] transition-[width] duration-200 overflow-hidden',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--text-primary)]/10 px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-display text-sm font-bold text-[var(--text-primary)]">Admin</span>
              <span className="shrink-0 rounded bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
                Studio
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)]',
              collapsed && 'mx-auto',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : 'gap-2.5',
                  active
                    ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/6 hover:text-[var(--text-primary)]',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content — full height with its own header */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-4">
          {/* Breadcrumb / page context */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Admin Studio</span>
            {pathname !== '/admin' && (
              <>
                <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
                <span className="capitalize">
                  {pathname.split('/').filter(Boolean).slice(1).join(' / ')}
                </span>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/problems"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to app
            </Link>
            <div className="h-4 w-px bg-[var(--text-primary)]/12" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
