'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Menu, Network, UserRound, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Role } from '@stackdify/shared-types';

interface NavbarProps {
  overlay?: boolean;
}

export function Navbar({ overlay = false }: NavbarProps) {
  const { user, isAuthenticated, isReady, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/problems', label: 'Problems' },
    { href: '/leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === Role.ADMIN ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header
      className={cn(
        'z-50 px-3 py-3 sm:px-4',
        overlay ? 'fixed left-0 right-0 top-0' : 'sticky top-0',
      )}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative rounded-full border border-white/70 bg-white/70 px-3 py-1 shadow-[0_16px_48px_rgba(79,70,229,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[var(--bg-secondary)]/75 dark:shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
          <div className="flex min-h-14 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 rounded-full pr-2" onClick={closeMenu}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <Network className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-display text-lg font-bold text-transparent sm:text-xl dark:from-indigo-300 dark:to-purple-300">
                Stackdify
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white/65 hover:text-indigo-600 dark:text-[var(--text-secondary)] dark:hover:bg-white/10 dark:hover:text-[var(--text-primary)]',
                    isActive(link.href) &&
                      'bg-white/80 text-indigo-700 shadow-sm dark:bg-white/10 dark:text-[var(--text-primary)]',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle className="rounded-full bg-white/40 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10" />
              {isReady && isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex max-w-44 items-center gap-2 rounded-full bg-white/45 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white/75 hover:text-indigo-600 dark:bg-white/5 dark:text-[var(--text-primary)] dark:hover:bg-white/10"
                    aria-label="Go to dashboard"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <UserRound className="h-4 w-4 text-indigo-600 dark:text-[var(--accent-primary)]" aria-hidden="true" />
                    )}
                    <span className="truncate">{user.displayName}</span>
                    {user.streak >= 1 && <StreakBadge streak={user.streak} />}
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    aria-label="Sign out"
                    className="rounded-full text-gray-700 hover:bg-white/65 dark:text-[var(--text-primary)] dark:hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-gray-700 hover:bg-white/65 dark:text-[var(--text-primary)] dark:hover:bg-white/10"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-full bg-none bg-indigo-600 px-5 hover:bg-indigo-700">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle className="rounded-full bg-white/45 hover:bg-white/75 dark:bg-white/5 dark:hover:bg-white/10" />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/55 text-gray-700 transition-colors hover:bg-white/80 dark:bg-white/5 dark:text-[var(--text-primary)] dark:hover:bg-white/10"
                onClick={() => setIsMenuOpen((value) => !value)}
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-[var(--bg-secondary)]/95 md:hidden">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      'rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:text-indigo-600 dark:text-[var(--text-secondary)] dark:hover:bg-white/10 dark:hover:text-[var(--text-primary)]',
                      isActive(link.href) && 'bg-white text-indigo-700 dark:bg-white/10 dark:text-[var(--text-primary)]',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-2 border-t border-gray-200 pt-3 dark:border-white/10">
                  {isReady && isAuthenticated && user ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-xl bg-white/60 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-white/5 dark:text-[var(--text-primary)]"
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-[var(--accent-primary)]" aria-hidden="true" />
                        )}
                        <span className="truncate">{user.displayName}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)]/5 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--text-primary)]/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="rounded-xl bg-white/60 px-4 py-3 text-center text-sm font-medium text-gray-700 dark:bg-white/5 dark:text-[var(--text-primary)]"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeMenu}
                        className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700"
                      >
                        Get started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
