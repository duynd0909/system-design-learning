'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export function AuthCallbackClient({ token }: { token: string }) {
  const router = useRouter();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('OAuth callback did not include an access token.');
      return;
    }

    void completeOAuth(token)
      .then(() => router.replace('/problems'))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Could not complete sign in.');
      });
  }, [completeOAuth, router, token]);

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
