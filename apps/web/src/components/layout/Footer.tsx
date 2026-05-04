import Link from 'next/link';
import { GitFork } from 'lucide-react';
import { Boxes } from '@/components/ui/background-boxes';

const PLATFORM_LINKS = [
  { label: 'Problems', href: '/problems' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

const COMING_SOON = ['Blog', 'Docs', 'About'];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--text-primary)]/8 bg-[var(--bg-primary)]">
      {/* Animated grid background */}
      <Boxes />

      {/* Radial gradient mask */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 100%, transparent 20%, var(--bg-primary) 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div
                className="w-9 h-9 shrink-0 transition-opacity duration-200 group-hover:opacity-80"
                style={{
                  background: '#00ffa3',
                  clipPath:
                    'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              />
              <span className="text-xl font-black text-foreground tracking-tight">
                Stackdify
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
              A gamified platform for practising system design — drag components
              onto real architecture graphs and level up your engineering
              intuition.
            </p>
            {/* <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[#00ffa3] dark:hover:text-[#00ffa3]"
            >
              <GitFork className="h-4 w-4" aria-hidden="true" />
              Open source
            </a> */}
          </div>

          {/* Platform links */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">
              Platform
            </h3>
            <ul className="space-y-2">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[#00b37a] dark:hover:text-[#00ffa3]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coming soon */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">
              Resources
            </h3>
            <ul className="space-y-2">
              {COMING_SOON.map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span className="text-sm text-[var(--text-secondary)]/50">
                    {label}
                  </span>
                  <span className="rounded-full bg-[#00ffa3]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#00b37a] dark:text-[#00ffa3]">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--text-primary)]/8 pt-6 text-xs text-[var(--text-secondary)] sm:flex-row">
          <p>© {new Date().getFullYear()} Stackdify. All rights reserved.</p>
          <p>Built for engineers, by engineers.</p>
        </div>
      </div>
    </footer>
  );
}
