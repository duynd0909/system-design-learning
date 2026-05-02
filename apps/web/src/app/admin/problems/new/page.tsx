'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  useCreateProblem,
  useReplaceRequirements,
  useComponentTypes,
} from '@/lib/api';
import {
  ProblemMetadataForm,
  type ProblemMetadata,
} from '@/components/admin/ProblemMetadataForm';
import {
  RequirementBuilder,
  type RequirementData,
} from '@/components/admin/RequirementBuilder';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, Layers, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tab = 'metadata' | 'requirements';

const FORM_ID = 'new-problem-metadata-form';

export default function NewProblemPage() {
  const { token } = useAuth();
  const router = useRouter();

  const { data: componentTypes, isLoading: ctLoading } = useComponentTypes();
  const createProblem = useCreateProblem(token ?? '');
  const replaceRequirements = useReplaceRequirements(token ?? '');

  const [tab, setTab] = useState<Tab>('metadata');
  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (metadata: ProblemMetadata) => {
    setError('');
    try {
      const created = await createProblem.mutateAsync(metadata);
      await replaceRequirements.mutateAsync({
        slug: created.slug,
        requirements,
      });
      router.push('/admin/problems');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create problem');
    }
  };

  const isSubmitting = createProblem.isPending || replaceRequirements.isPending;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Compact header */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-4">
        {/* Left: breadcrumb */}
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/admin/problems"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Problems
          </Link>
          <span className="text-[var(--text-primary)]/20" aria-hidden="true">
            /
          </span>
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
            New Problem
          </span>
        </div>

        {/* Center: tab switcher */}
        <div
          role="tablist"
          aria-label="Problem editor tabs"
          className="flex rounded-lg bg-[var(--text-primary)]/6 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'metadata'}
            onClick={() => setTab('metadata')}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              tab === 'metadata'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Metadata
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'requirements'}
            onClick={() => setTab('requirements')}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              tab === 'requirements'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Requirements
            {requirements.length > 0 && (
              <span className="rounded-full bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[var(--accent-primary)]">
                {requirements.reduce((acc, r) => acc + r.nodes.length, 0)}n
              </span>
            )}
          </button>
        </div>

        {/* Right: create button */}
        <Button
          type="submit"
          form={FORM_ID}
          variant="default"
          size="sm"
          disabled={isSubmitting}
          className="shrink-0"
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          {isSubmitting ? 'Creating…' : 'Create Problem'}
        </Button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 border-b border-[var(--slot-incorrect)]/20 bg-[var(--slot-incorrect)]/8 px-4 py-2.5 text-xs text-[var(--slot-incorrect)]">
          {error}
        </div>
      )}

      {/* Tab panels — both stay in DOM so React Flow initialises with real dimensions */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Metadata panel */}
        <div
          role="tabpanel"
          aria-label="Metadata"
          className={cn(
            'absolute inset-0 overflow-y-auto bg-[var(--bg-primary)] transition-opacity duration-150',
            tab === 'metadata'
              ? 'z-10 opacity-100'
              : 'pointer-events-none opacity-0',
          )}
        >
          <div className="mx-auto max-w-2xl px-6 py-8">
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Problem Metadata
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Define the problem&apos;s identity — title, slug, difficulty,
                and what players need to design.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-6">
              <ProblemMetadataForm
                formId={FORM_ID}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                hideSubmit
              />
            </div>
          </div>
        </div>

        {/* Requirements panel */}
        <div
          role="tabpanel"
          aria-label="Requirements"
          className={cn(
            'absolute inset-0 transition-opacity duration-150',
            tab === 'requirements'
              ? 'z-10 opacity-100'
              : 'pointer-events-none opacity-0',
          )}
        >
          {ctLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-80 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <RequirementBuilder
              componentTypes={componentTypes ?? []}
              onChange={setRequirements}
              fullHeight
            />
          )}
        </div>
      </div>
    </div>
  );
}
