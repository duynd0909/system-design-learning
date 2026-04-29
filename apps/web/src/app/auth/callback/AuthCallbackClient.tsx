'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';

const PROVIDER_LABELS: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
};

interface AuthCallbackClientProps {
  token: string;
  linked?: string;
  provider?: string;
}

export function AuthCallbackClient({ token, linked, provider }: AuthCallbackClientProps) {
  const router = useRouter();
  const { completeOAuth } = useAuth();
  const toastCtx = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('OAuth callback did not include an access token.');
      return;
    }

    void completeOAuth(token)
      .then(() => {
        if (linked === '1') {
          const providerLabel = PROVIDER_LABELS[provider ?? ''] ?? 'social';
          toastCtx?.toast(`Your ${providerLabel} account has been linked to your existing Stackdify account.`, 'success');
        }
        router.replace('/problems');
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Could not complete sign in.');
      });
  }, [completeOAuth, linked, provider, router, toastCtx, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="max-w-sm text-center">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Sign in failed</h1>
            <p className="mt-3 text-sm text-red-500">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">Finishing sign in</h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Redirecting you to the problem list.</p>
          </>
        )}
      </div>
    </main>
  );
}
