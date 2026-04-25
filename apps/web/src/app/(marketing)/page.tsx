import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';

const features = [
  {
    icon: '🏗️',
    title: 'Real Architecture Challenges',
    description: 'Practice with production-grade system designs — Instagram, YouTube, TikTok, and more.',
  },
  {
    icon: '🎮',
    title: 'Learn by Playing',
    description: 'Drag components onto the architecture graph and see exactly what you got right.',
  },
  {
    icon: '📈',
    title: 'Track Your Growth',
    description: 'XP, levels, and streaks keep you motivated through consistent practice.',
  },
  {
    icon: '🏆',
    title: 'Compete & Compare',
    description: 'See how you rank against engineers worldwide on the leaderboard.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(79,70,229,0.12),transparent)]" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 px-4 py-1.5 text-sm text-[var(--accent-primary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
            </span>
            Sprint 1 — Foundation Release
          </div>

          <h1 className="font-display mb-6 text-5xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
            The Joy of{' '}
            <span className="text-[var(--accent-primary)]">System Design</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-secondary)] sm:text-xl">
            Stop reading. Start building. Practice real-world system architectures through
            an interactive drag-and-drop game that gives you instant, scored feedback.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/problems">
              <Button size="lg">Start Practicing →</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg">Create Account</Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Free to play. No credit card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--bg-secondary)] px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              How it works
            </h2>
            <p className="text-[var(--text-secondary)]">Three steps to sharpen your system design intuition.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Pick a system', desc: 'Choose from real-world architectures like Instagram, YouTube, or TikTok.' },
              { step: '02', title: 'Fill the blanks', desc: 'Drag component chips (CDN, Load Balancer, Cache…) onto the masked architecture graph.' },
              { step: '03', title: 'Get scored', desc: 'Submit and see which components you nailed and which need more study — with explanations.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-lg font-bold text-[var(--accent-primary)]">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--bg-primary)] px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Built for engineers
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} hover>
                <div className="mb-3 text-3xl">{f.icon}</div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--accent-primary)] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to level up?
          </h2>
          <p className="mb-8 text-indigo-200">
            Join engineers practicing system design every day.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-[var(--accent-primary)] hover:bg-indigo-50"
            >
              Start for free →
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
