'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Database, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Role } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/problems', label: 'Problems', icon: Database, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== Role.ADMIN) {
      void router.push('/login');
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady || !isAuthenticated || user?.role !== Role.ADMIN) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)]">
        <div className="flex h-14 items-center gap-2 border-b border-[var(--text-primary)]/10 px-4">
          <span className="font-display text-sm font-bold text-[var(--text-primary)]">Admin</span>
          <span className="rounded bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
            Studio
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/6 hover:text-[var(--text-primary)]',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--text-primary)]/10 p-3 space-y-2">
          <ThemeToggle />
          <Link
            href="/problems"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
