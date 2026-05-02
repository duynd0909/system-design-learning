'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Role } from '@stackdify/shared-types';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';

interface NavbarProps {
  overlay?: boolean;
}

export function Navbar({ overlay = false }: NavbarProps) {
  const { user, isAuthenticated, isReady, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  const navLinks = [
    { href: '/problems', label: 'Problems' },
    { href: '/leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === Role.ADMIN ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'z-50 mx-auto w-full transition-all ease-out border-b border-transparent md:border-none',
        overlay ? 'fixed left-0 right-0 top-0' : 'sticky top-0',
        scrolled && !open 
          ? 'bg-white/80 supports-[backdrop-filter]:bg-white/60 dark:bg-[#141414]/80 backdrop-blur-xl border-border md:top-4 md:max-w-7xl md:rounded-full md:border md:border-black/8 dark:md:border-white/6 md:shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:md:shadow-[0_8px_32px_rgba(0,255,163,0.06)]' 
          : 'bg-transparent md:max-w-7xl md:top-4',
        open && 'bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl'
      )}
    >
      <nav
        className={cn(
          'flex h-16 w-full items-center justify-between px-6 md:h-14 md:transition-all md:ease-out',
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-full pr-2"
          onClick={closeMenu}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 shrink-0 transition-transform hover:scale-105"
              style={{
                background: '#00ffa3',
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            />
            <span className="text-xl font-black text-foreground tracking-tight">
              Stackdify
            </span>
          </div>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'rounded-full px-4 text-sm font-medium transition-colors duration-200 hover:text-[#00b37a] dark:text-[var(--text-secondary)] dark:hover:text-[#00ffa3]',
                isActive(link.href) &&
                  'bg-black/6 text-[#00b37a] dark:bg-[#00ffa3]/8 dark:text-[#00ffa3] dark:hover:bg-[#00ffa3]/12'
              )}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="mx-2 h-4 w-[1px] bg-border" />
          
          <ThemeToggle className="rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/8 mr-1" />
          {isReady && isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="flex max-w-44 items-center gap-2 rounded-full bg-black/5 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-black/8 hover:text-[#00b37a] dark:bg-white/5 dark:text-[var(--text-primary)] dark:hover:bg-white/8 dark:hover:text-[#00ffa3]"
                aria-label="Go to dashboard"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <UserRound
                    className="h-4 w-4 text-[#00b37a] dark:text-[#00ffa3]"
                    aria-hidden="true"
                  />
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
                className="rounded-full text-gray-600 dark:text-[var(--text-secondary)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" tabIndex={-1}>
                <Button
                  variant="ghost"
                  className="rounded-full text-gray-600 dark:text-[var(--text-secondary)] font-medium"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/register" tabIndex={-1}>
                <Button
                  className="rounded-full bg-[#00ffa3] px-5 ml-1 text-black font-bold hover:bg-[#00ffa3]/90 shadow-[0_4px_16px_rgba(0,255,163,0.3)] transition-all duration-200 hover:scale-105"
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className="rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/8" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen(!open)}
            className="rounded-full bg-black/6 text-gray-700 hover:bg-black/10 dark:bg-white/5 dark:text-[var(--text-primary)] dark:hover:bg-white/8"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>

      {/* Mobile Animated Menu Overlay */}
      <div
        className={cn(
          'fixed right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-t border-black/8 dark:border-white/8 bg-white/95 dark:bg-[#141414]/95 supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-[#141414]/80 backdrop-blur-xl md:hidden',
          overlay ? 'top-16' : 'top-16',
          open ? 'block' : 'hidden'
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 data-[slot=open]:fade-in-0 data-[slot=closed]:fade-out-0 ease-out duration-300',
            'flex h-full w-full flex-col justify-between gap-y-2 p-6 overflow-y-auto'
          )}
        >
          <div className="flex flex-col gap-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={cn(
                  'flex items-center rounded-xl px-4 py-4 text-base font-semibold text-gray-600 transition-colors hover:bg-black/5 hover:text-[#00b37a] dark:text-[var(--text-secondary)] dark:hover:bg-white/6 dark:hover:text-[#00ffa3]',
                  isActive(link.href) &&
                    'bg-black/6 text-[#00b37a] dark:bg-[#00ffa3]/8 dark:text-[#00ffa3]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="flex flex-col gap-3 mt-auto pb-[env(safe-area-inset-bottom)]">
            {isReady && isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-4 text-base font-semibold text-gray-700 dark:bg-white/5 dark:text-[var(--text-primary)]"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <LayoutDashboard
                      className="h-5 w-5 text-[#00b37a] dark:text-[#00ffa3]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{user.displayName}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full py-6 text-base font-bold rounded-xl border-border"
                >
                  <LogOut className="mr-2 h-5 w-5" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" tabIndex={-1} className="w-full" onClick={closeMenu}>
                  <Button variant="outline" className="w-full py-6 text-base font-bold rounded-xl border-border">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" tabIndex={-1} className="w-full" onClick={closeMenu}>
                  <Button className="w-full py-6 text-base font-bold rounded-xl bg-[#00ffa3] text-black hover:bg-[#00ffa3]/90 shadow-[0_4px_16px_rgba(0,255,163,0.3)]">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
