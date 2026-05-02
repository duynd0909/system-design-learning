'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { AdminProblemListItem } from '@stackdify/shared-types';
import { Button } from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { usePublishProblem, useHideProblem, useSoftDeleteProblem, useRestoreProblem } from '@/lib/api';

interface ProblemRowActionsProps {
  problem: AdminProblemListItem;
  token: string;
}

export function ProblemRowActions({ problem, token }: ProblemRowActionsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const publish = usePublishProblem(token);
  const hide = useHideProblem(token);
  const softDelete = useSoftDeleteProblem(token);
  const restore = useRestoreProblem(token);

  const isDeleted = !!problem.deletedAt;
  const isPending = publish.isPending || hide.isPending || softDelete.isPending || restore.isPending;

  if (isDeleted) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          title="Restore"
          onClick={() => void restore.mutateAsync(problem.slug)}
          disabled={isPending}
          className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[var(--slot-correct)] hover:bg-[var(--slot-correct)]/10 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Restore
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {problem.isPublished ? (
          <button
            type="button"
            title="Hide"
            onClick={() => void hide.mutateAsync(problem.slug)}
            disabled={isPending}
            className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            title="Publish"
            onClick={() => void publish.mutateAsync(problem.slug)}
            disabled={isPending}
            className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--slot-correct)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          title="Edit"
          onClick={() => router.push(`/admin/problems/${problem.slug}/edit`)}
          className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)] transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={() => setShowDeleteModal(true)}
          disabled={isPending}
          className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--slot-incorrect)]/10 hover:text-[var(--slot-incorrect)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete problem?">
        <p className="text-sm text-[var(--text-secondary)]">
          &ldquo;<strong className="text-[var(--text-primary)]">{problem.title}</strong>&rdquo; will be soft-deleted and hidden from players. You can restore it later.
        </p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              void softDelete.mutateAsync(problem.slug).then(() => setShowDeleteModal(false));
            }}
            disabled={softDelete.isPending}
            className="bg-[var(--slot-incorrect)] hover:bg-[var(--slot-incorrect)]/90"
          >
            {softDelete.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
