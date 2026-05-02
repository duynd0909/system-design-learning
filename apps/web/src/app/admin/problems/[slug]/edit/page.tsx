'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  useAdminProblem,
  useUpdateProblem,
  useReplaceRequirements,
  usePublishProblem,
  useHideProblem,
  useComponentTypes,
} from '@/lib/api';
import { ProblemMetadataForm, type ProblemMetadata } from '@/components/admin/ProblemMetadataForm';
import { RequirementBuilder, type RequirementData } from '@/components/admin/RequirementBuilder';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye, EyeOff, FileText, Layers, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AdminRequirementDetail } from '@stackdify/shared-types';

const FORM_ID = 'edit-problem-metadata-form';

type Tab = 'metadata' | 'requirements';

function toRequirementData(r: AdminRequirementDetail): RequirementData {
  return {
    order: r.order,
    title: r.title,
    description: r.description,
    nodes: r.nodes,
    edges: r.edges,
    answer: r.answer,
  };
}

export default function EditProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();

  const { data, isLoading: problemLoading } = useAdminProblem(token ?? '', slug);
  const { data: componentTypes, isLoading: ctLoading } = useComponentTypes();

  const updateProblem = useUpdateProblem(token ?? '');
  const replaceRequirements = useReplaceRequirements(token ?? '');
  const publishProblem = usePublishProblem(token ?? '');
  const hideProblem = useHideProblem(token ?? '');

  const [tab, setTab] = useState<Tab>('metadata');
  // null = not yet initialized from API; [] = loaded but empty
  const [requirements, setRequirements] = useState<RequirementData[] | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (data?.requirements && requirements === null) {
      setRequirements(data.requirements.map(toRequirementData));
    }
  }, [data, requirements]);

  const handleSave = async (metadata: ProblemMetadata) => {
    setError('');
    setSuccess('');
    try {
      await updateProblem.mutateAsync({ slug, data: metadata });
      await replaceRequirements.mutateAsync({ slug, requirements: requirements ?? [] });
      setSuccess('Saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save problem');
    }
  };

  const handleTogglePublish = async () => {
    setError('');
    setSuccess('');
    try {
      if (data?.problem.isPublished) {
        await hideProblem.mutateAsync(slug);
        setSuccess('Problem hidden.');
      } else {
        await publishProblem.mutateAsync(slug);
        setSuccess('Problem published.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const isSubmitting = updateProblem.isPending || replaceRequirements.isPending;
  const isLoading = problemLoading || ctLoading;
  // Builder is ready only after requirements are hydrated from API response
  const isBuilderReady = !isLoading && requirements !== null;
  const isPublished = data?.problem.isPublished ?? false;
  const isDeleted = !!data?.problem.deletedAt;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Compact header */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-4">
        {/* Left: breadcrumb + title */}
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/admin/problems"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Problems
          </Link>
          <span className="text-[var(--text-primary)]/20" aria-hidden="true">/</span>
          {isLoading ? (
            <Skeleton className="h-5 w-32 rounded" />
          ) : (
            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {data?.problem.title ?? slug}
            </span>
          )}
          {!isLoading && (
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              isDeleted
                ? 'bg-[var(--slot-incorrect)]/12 text-[var(--slot-incorrect)]'
                : isPublished
                  ? 'bg-[var(--slot-correct)]/12 text-[var(--slot-correct)]'
                  : 'bg-[var(--text-secondary)]/12 text-[var(--text-secondary)]',
            )}>
              {isDeleted ? 'Deleted' : isPublished ? 'Published' : 'Hidden'}
            </span>
          )}
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
            {(requirements?.length ?? 0) > 0 && (
              <span className="rounded-full bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[var(--accent-primary)]">
                {requirements!.length}r
              </span>
            )}
          </button>
        </div>

        {/* Right: publish toggle + save */}
        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && !isDeleted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTogglePublish}
              disabled={publishProblem.isPending || hideProblem.isPending}
            >
              {isPublished ? (
                <><EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Hide</>
              ) : (
                <><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Publish</>
              )}
            </Button>
          )}
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            disabled={isSubmitting || isLoading}
            className="shrink-0"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Status banners */}
      {error && (
        <div className="shrink-0 border-b border-[var(--slot-incorrect)]/20 bg-[var(--slot-incorrect)]/8 px-4 py-2.5 text-xs text-[var(--slot-incorrect)]">
          {error}
        </div>
      )}
      {success && (
        <div className="shrink-0 border-b border-[var(--slot-correct)]/20 bg-[var(--slot-correct)]/8 px-4 py-2.5 text-xs text-[var(--slot-correct)]">
          {success}
        </div>
      )}
      {isDeleted && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
          This problem has been soft-deleted. Restore it from the problems list before editing.
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
            tab === 'metadata' ? 'z-10 opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="mx-auto max-w-2xl px-6 py-8">
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Problem Metadata</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Edit the problem&apos;s title, description, difficulty, and category.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                </div>
              ) : (
                <ProblemMetadataForm
                  formId={FORM_ID}
                  initialValues={data?.problem}
                  onSubmit={handleSave}
                  isLoading={isSubmitting}
                  disableSlug
                  hideSubmit
                />
              )}
            </div>
          </div>
        </div>

        {/* Requirements panel */}
        <div
          role="tabpanel"
          aria-label="Requirements"
          className={cn(
            'absolute inset-0 transition-opacity duration-150',
            tab === 'requirements' ? 'z-10 opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          {!isBuilderReady ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-80 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <RequirementBuilder
              key={slug}
              initialRequirements={requirements}
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
