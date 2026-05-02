import Link from 'next/link';
import { Gamepad2, Network, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid';
import { SocialProofSection } from '@/components/marketing/SocialProofSection';
import { LandingHero } from '@/components/marketing/LandingHero';

const features: BentoItem[] = [
  {
    icon: <Network className="h-4 w-4 text-sky-500" />,
    title: 'Real Architecture Challenges',
    meta: 'Production patterns',
    description:
      'Practice with production-grade system designs — Instagram, YouTube, TikTok, and more.',
    status: 'Core',
    tags: ['Systems', 'Scale'],
    cta: 'Explore drills ->',
    colSpan: 3,
    hasPersistentHover: true,
  },
  {
    icon: <Gamepad2 className="h-4 w-4 text-violet-500" />,
    title: 'Learn by Playing',
    meta: 'Interactive',
    description:
      'Drag components onto the architecture graph and see exactly what you got right.',
    status: 'Game loop',
    tags: ['Drag-drop', 'Practice'],
    cta: 'Play now ->',
    colSpan: 2,
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    title: 'Track Your Growth',
    meta: 'XP and streaks',
    description:
      'XP, levels, and streaks keep you motivated through consistent practice.',
    status: 'Progress',
    tags: ['XP', 'Levels'],
    cta: 'Track growth ->',
    colSpan: 2,
  },
  {
    icon: <Trophy className="h-4 w-4 text-amber-500" />,
    title: 'Compete & Compare',
    meta: 'Leaderboard',
    description:
      'See how you rank against engineers worldwide on the leaderboard.',
    status: 'Live',
    tags: ['Ranking', 'Peers'],
    cta: 'Compare ->',
    colSpan: 3,
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingHero />

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-[var(--bg-secondary)] px-4 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              How it works
            </h2>
            <p className="text-[var(--text-secondary)]">
              Three steps to sharpen your system design intuition.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Pick a system',
                desc: 'Choose from real-world architectures like Instagram, YouTube, or TikTok.',
              },
              {
                step: '02',
                title: 'Fill the blanks',
                desc: 'Drag component chips (CDN, Load Balancer, Cache…) onto the masked architecture graph.',
              },
              {
                step: '03',
                title: 'Get scored',
                desc: 'Submit and see which components you nailed and which need more study — with explanations.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-lg font-bold text-[var(--accent-primary)]">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof — leaderboard teaser */}
      <SocialProofSection />

      {/* Features */}
      <section className="bg-[var(--bg-primary)] px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display mb-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Built for engineers
            </h2>
          </div>
          <BentoGrid items={features} className="md:grid-cols-5" />
        </div>
      </section>

      {/* CTA — aurora-tinted strip */}
      <section className="relative overflow-hidden px-4 py-20">
        <div
          className="absolute inset-0 -z-10 bg-[var(--bg-secondary)]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 100% at 10% 50%, var(--aurora-color1) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 90% 50%, var(--aurora-color2) 0%, transparent 60%)
            `,
          }}
        />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            Ready to level up?
          </h2>
          <p className="mb-8 text-[var(--text-secondary)]">
            Join engineers practicing system design every day.
          </p>
          <Link href="/register">
            <Button size="lg">Start for free →</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
