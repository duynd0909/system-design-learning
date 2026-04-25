'use client';

import Link from 'next/link';
import { LogOut, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';

export function Navbar() {
  const { user, isAuthenticated, isReady, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md">
      {/* Aurora gradient underline */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-purple-300 dark:to-fuchsia-300">
            Stackdify
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/problems"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Problems
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Leaderboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isReady && isAuthenticated && user ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-[var(--text-primary)]/10 px-3 py-1.5 text-sm text-[var(--text-primary)] sm:flex">
                <UserRound className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
                <span className="max-w-28 truncate">{user.displayName}</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
