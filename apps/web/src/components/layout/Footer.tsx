export function Footer() {
  return (
    <footer className="relative bg-[var(--bg-primary)] py-8">
      {/* Aurora gradient topline */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/25 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--text-secondary)] sm:flex-row">
          <p>
            <span className="font-display font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-purple-300 dark:to-fuchsia-300">
              Stackdify
            </span>
            {' '}— Practice makes permanent.
          </p>
          <p>Built for engineers, by engineers.</p>
        </div>
      </div>
    </footer>
  );
}
