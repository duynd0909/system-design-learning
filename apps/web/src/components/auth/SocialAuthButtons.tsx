'use client';

import Image from 'next/image';
import githubIconDark from '@icons/GitHub_Invertocat_White_Clearspace.svg';
import githubIconLight from '@icons/GitHub_Invertocat_Black_Clearspace.svg';
import googleIcon from '@icons/google.svg';
import { API_BASE } from '@/lib/api';

const providers = [
  {
    name: 'GitHub',
    href: `${API_BASE}/auth/github`,
    icon: (
      <span className="relative h-4 w-4 shrink-0" aria-hidden="true">
        <Image
          src={githubIconLight}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 object-contain dark:hidden"
        />
        <Image
          src={githubIconDark}
          alt=""
          width={16}
          height={16}
          className="hidden h-4 w-4 object-contain dark:block"
        />
      </span>
    ),
  },
  {
    name: 'Google',
    href: `${API_BASE}/auth/google`,
    icon: (
      <Image
        src={googleIcon}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 shrink-0 object-contain opacity-80 transition duration-200 dark:invert"
        aria-hidden="true"
      />
    ),
  },
] as const;

export function SocialAuthButtons() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      {providers.map((provider) => (
        <a
          key={provider.name}
          href={provider.href}
          className="group flex items-center justify-center gap-2 rounded-lg border border-[var(--text-primary)]/15 bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/50 hover:shadow-[0_8px_24px_rgba(79,70,229,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] dark:bg-white/5 dark:hover:bg-white/10"
        >
          {provider.icon}
          <span>{provider.name}</span>
        </a>
      ))}
    </div>
  );
}
