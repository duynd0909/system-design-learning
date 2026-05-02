'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/providers/AuthProvider';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8)
      next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      await login(form);
      router.push('/problems');
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Invalid credentials',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Sign in to continue your practice
        </p>
      </div>

      <Card>
        <SocialAuthButtons />

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--text-primary)]/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-secondary)]">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.general && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {errors.general}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
            error={errors.password}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-[var(--accent-primary)] hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
