'use client';

import { useRouter } from 'next/navigation';
import MinimalModernHero from '@/components/ui/minimal';
import { type IconProps } from '@/components/ui/floating-icons-hero-section';
import { useHeroStats } from '@/lib/api';


const s = 'currentColor';

const icons: IconProps[] = [
  {
    id: 1,
    className: 'top-[8%] right-[28%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3v4M12 7l-3 3M12 7l3 3M7 10v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="5" cy="19" r="2" stroke={s} strokeWidth="2" />
        <circle cx="12" cy="19" r="2" stroke={s} strokeWidth="2" />
        <circle cx="19" cy="19" r="2" stroke={s} strokeWidth="2" />
        <path d="M7 10H5v7M12 10v7M17 10h2v7" stroke={s} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 2,
    className: 'top-[5%] right-[8%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="5" rx="8" ry="3" stroke={s} strokeWidth="2" />
        <path
          d="M4 5v5c0 1.657 3.582 3 8 3s8-1.343 8-3V5"
          stroke={s}
          strokeWidth="2"
        />
        <path
          d="M4 10v5c0 1.657 3.582 3 8 3s8-1.343 8-3v-5"
          stroke={s}
          strokeWidth="2"
        />
        <path
          d="M4 15v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4"
          stroke={s}
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: 3,
    className: 'top-[22%] right-[3%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
          stroke={s}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 4,
    className: 'bottom-[10%] right-[6%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke={s} strokeWidth="2" />
        <path
          d="M12 3c-2 3-3 5.5-3 9s1 6 3 9M12 3c2 3 3 5.5 3 9s-1 6-3 9M3 12h18"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M6 9h12M6 15h12" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 5,
    className: 'top-[40%] right-[22%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="4" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="10" width="18" height="4" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="16" width="18" height="4" rx="1" stroke={s} strokeWidth="2" />
        <path d="M7 6h1M7 12h1M7 18h1" stroke={s} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 6,
    className: 'top-[55%] right-[28%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="4" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="11" width="14" height="4" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="17" width="10" height="4" rx="1" stroke={s} strokeWidth="2" />
        <path
          d="M20 13l2-2M20 13l2 2"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 7,
    className: 'bottom-[22%] right-[14%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="5" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="10" width="18" height="5" rx="1" stroke={s} strokeWidth="2" />
        <rect x="3" y="17" width="18" height="5" rx="1" stroke={s} strokeWidth="2" />
        <circle cx="7" cy="5.5" r="1" fill={s} />
        <circle cx="7" cy="12.5" r="1" fill={s} />
        <circle cx="7" cy="19.5" r="1" fill={s} />
      </svg>
    ),
  },
  {
    id: 8,
    className: 'top-[15%] right-[16%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 8l7-5 7 5v10l-7 3-7-3V8z"
          stroke={s}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 3v18M5 8l7 5 7-5"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 9,
    className: 'top-[70%] right-[22%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke={s} strokeWidth="2" />
        <path d="M8 9h8M8 12h6M8 15h4" stroke={s} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 5v14" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 10,
    className: 'bottom-[5%] right-[32%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="18" height="14" rx="2" stroke={s} strokeWidth="2" />
        <path
          d="M3 10h18M7 10v10M12 10v10M17 10v10"
          stroke={s}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M7 6V4M12 6V4M17 6V4" stroke={s} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 11,
    className: 'top-[48%] right-[5%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke={s} strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke={s} strokeWidth="2" />
        <path
          d="M12 3v6M12 15v6M3 12h6M15 12h6"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5.636 5.636l4.243 4.243M14.121 14.121l4.243 4.243M5.636 18.364l4.243-4.243M14.121 9.879l4.243-4.243"
          stroke={s}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 12,
    className: 'top-[62%] right-[8%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L4 6v6c0 5.523 3.582 10.74 8 12 4.418-1.26 8-6.477 8-12V6L12 2z"
          stroke={s}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 13,
    className: 'top-[30%] right-[10%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="6" stroke={s} strokeWidth="2" />
        <path d="M20 20l-4-4" stroke={s} strokeWidth="2" strokeLinecap="round" />
        <path d="M7 10h6M10 7v6" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 14,
    className: 'bottom-[35%] right-[3%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 12h3l3-6 4 12 3-9 2 3h3"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="2" y="3" width="20" height="16" rx="2" stroke={s} strokeWidth="2" />
        <path d="M8 22h8M12 19v3" stroke={s} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 15,
    className: 'top-[82%] right-[28%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2l4 2.5v5L12 12 8 9.5v-5L12 2z"
          stroke={s}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 12l4 2.5v5L12 22l-4-2.5v-5L12 12z"
          stroke={s}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M4 7l4 2.5M16 9.5l4-2.5M8 14.5L4 17M20 17l-4-2.5"
          stroke={s}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 16,
    className: 'top-[18%] right-[30%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 6h16M4 12h16M4 18h16"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="6" r="2" fill={s} />
        <circle cx="16" cy="12" r="2" fill={s} />
        <circle cx="10" cy="18" r="2" fill={s} />
        <path
          d="M17 9l2 3-2 3"
          stroke={s}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function LandingHero() {
  const router = useRouter();
  const { isLoading, problemCount, engineerCount, topXp } = useHeroStats();

  const stats = [
    { value: isLoading ? '—' : (problemCount ?? '50+'), label: 'System Designs' },
    { value: isLoading ? '—' : (engineerCount ?? '10K+'), label: 'Engineers' },
    { value: isLoading ? '—' : (topXp ? `${topXp} XP` : '95%'), label: 'Top Score' },
    { value: '4.9★', label: 'Rating' },
  ];

  return (
    <MinimalModernHero
      logo={
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10"
            style={{
              background: '#00ffa3',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
          <span className="text-2xl font-black text-foreground tracking-tight">Stackdify</span>
        </div>
      }
      badge="System Design Practice"
      title="Master System Design"
      subtitle="Stop reading. Start building."
      description="Drag real components onto architecture graphs and get instant scored feedback. Practice Instagram, YouTube, TikTok and more — at your own pace."
      primaryButton={{
        label: 'Start Practicing →',
        onClick: () => router.push('/problems'),
      }}
      secondaryButton={{
        label: 'See How It Works',
        onClick: () =>
          document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }),
      }}
      stats={stats}
      icons={icons}
      accentColor="#00ffa3"
    />
  );
}

