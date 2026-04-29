import Link from 'next/link';
import { GitFork, Network } from 'lucide-react';
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

      {/* Radial gradient mask — fades boxes toward center so content stays readable */}
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
            <Link href="/" className="group inline-flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <Network className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-purple-300">
                Stackdify
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
              A gamified platform for practising system design — drag components onto real
              architecture graphs and level up your engineering intuition.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              <GitFork className="h-4 w-4" aria-hidden="true" />
              Open source
            </a>
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
                    className="text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
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
                  <span className="text-sm text-[var(--text-secondary)]/50">{label}</span>
                  <span className="rounded-full bg-[var(--accent-primary)]/12 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
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
