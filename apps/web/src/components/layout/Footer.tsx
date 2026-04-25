export function Footer() {
  return (
    <footer className="border-t border-[var(--text-primary)]/10 bg-[var(--bg-primary)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--text-secondary)] sm:flex-row">
          <p>
            <span className="font-display font-semibold text-[var(--accent-primary)]">Joy</span>
            {' '}of System Design — Practice makes permanent.
          </p>
          <p>Built for engineers, by engineers.</p>
        </div>
      </div>
    </footer>
  );
}
