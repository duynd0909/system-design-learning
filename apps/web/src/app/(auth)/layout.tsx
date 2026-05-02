import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <header className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="w-9 h-9 shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: '#00ffa3',
              clipPath:
                'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
          <div className="flex flex-col">
            <span className="font-display text-xl font-black tracking-tight text-[var(--text-primary)]">
              Stackdify
            </span>
            <span className="hidden text-xs font-medium text-[var(--text-secondary)]/75 sm:block">
              Stop reading. Start building.
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
