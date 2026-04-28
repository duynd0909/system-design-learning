import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <header className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="group flex flex-col">
          <span className="font-display text-xl font-bold leading-tight text-[var(--text-primary)]">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-purple-300">
              Stackdify
            </span>
          </span>
          <span className="hidden text-xs font-medium text-[var(--text-secondary)]/75 sm:block">
            Stop reading. Start building.
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
