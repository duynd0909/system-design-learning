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
  username: string;
  displayName: string;
  password: string;
  repeatPassword: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  repeatPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState<FormState>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    repeatPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = 'Enter a valid email';

    if (!form.username) next.username = 'Username is required';
    else if (form.username.length < 3)
      next.username = 'Must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      next.username = 'Only letters, numbers, underscores';

    if (!form.displayName) next.displayName = 'Display name is required';
    else if (form.displayName.length < 2)
      next.displayName = 'Must be at least 2 characters';

    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8)
      next.password = 'Must be at least 8 characters';

    if (!form.repeatPassword) next.repeatPassword = 'Repeat your password';
    else if (form.repeatPassword !== form.password)
      next.repeatPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      await register({
        email: form.email,
        username: form.username,
        displayName: form.displayName,
        password: form.password,
      });
      router.push('/problems');
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
      error: errors[key],
    };
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Start practicing system design today
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
              or sign up with email
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
            {...field('email')}
          />
          <Input
            label="Username"
            type="text"
            autoComplete="username"
            {...field('username')}
          />
          <Input
            label="Display name"
            type="text"
            autoComplete="name"
            {...field('displayName')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            {...field('password')}
          />
          <Input
            label="Repeat password"
            type="password"
            autoComplete="new-password"
            {...field('repeatPassword')}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[var(--accent-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
