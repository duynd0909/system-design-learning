import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <header className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="font-display text-xl font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-primary)]">Joy</span> of System Design
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
