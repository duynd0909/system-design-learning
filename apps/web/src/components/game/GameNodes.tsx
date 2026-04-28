'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import type { ComponentType } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';
import { scaleIn, spring } from '@/lib/animations';
import { ActorIcon, iconForComponent } from './component-icons';

export const slotDropId = (slotId: string) => `slot:${slotId}`;

export interface ComponentCanvasData extends Record<string, unknown> {
  componentSlug: string;
  label: string;
  description?: string;
}

export interface BlankSlotData extends Record<string, unknown> {
  slotId: string;
}

export interface FilledSlotData extends Record<string, unknown> {
  slotId: string;
  component: ComponentType;
  onClear: (slotId: string) => void;
}

export interface ActorCanvasData extends Record<string, unknown> {
  label: string;
}

export type GameFlowNode =
  | Node<ComponentCanvasData, 'component'>
  | Node<BlankSlotData, 'blankSlot'>
  | Node<FilledSlotData, 'filledSlot'>
  | Node<ActorCanvasData, 'actor'>;

function NodeHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-2 !bg-[var(--accent-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-2 !bg-[var(--accent-primary)]" />
    </>
  );
}

export function ComponentNode({ data, selected }: NodeProps<Node<ComponentCanvasData, 'component'>>) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconForComponent(data.componentSlug);

  return (
    <div
      aria-label={`${data.label} component node`}
      className={cn(
        'relative min-w-36 rounded-lg border bg-[var(--slot-filled)] px-4 py-3 shadow-sm',
        'border-[var(--text-primary)]/15 text-[var(--text-primary)]',
        selected && 'border-[var(--accent-primary)] shadow-md',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHandles />
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{data.label}</div>
          <div className="truncate text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {data.componentSlug}
          </div>
        </div>
      </div>

      {/* Description tooltip */}
      {hovered && data.description && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg bg-[var(--text-primary)] px-3 py-2 text-xs text-[var(--bg-primary)] shadow-xl"
        >
          {data.description}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
        </div>
      )}
    </div>
  );
}

export function BlankSlotNode({ data, selected }: NodeProps<Node<BlankSlotData, 'blankSlot'>>) {
  const prefersReduced = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(data.slotId),
    data: { slotId: data.slotId },
  });

  return (
    <div
      ref={setNodeRef}
      aria-label={`Blank slot — drop a component here`}
      className={cn(
        'grid min-h-20 min-w-40 place-items-center rounded-lg border-2 border-dashed px-4 py-3',
        'border-[var(--slot-blank)] bg-[var(--slot-blank)]/10 text-[var(--slot-blank)]',
        'transition-all duration-150',
        !prefersReduced && !isOver && 'animate-slot-pulse',
        (selected || isOver) && 'border-solid bg-[var(--slot-blank)]/20',
      )}
      style={isOver ? {
        boxShadow: '0 0 16px rgba(249, 115, 22, 0.6)',
        transform: 'scale(1.05)',
      } : undefined}
    >
      <NodeHandles />
      <div className="text-center">
        <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--slot-blank)]/15 opacity-40">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>
        <div className="text-sm font-semibold">Drop here</div>
      </div>
    </div>
  );
}

export function FilledSlotNode({ data, selected }: NodeProps<Node<FilledSlotData, 'filledSlot'>>) {
  const prefersReduced = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(data.slotId),
    data: { slotId: data.slotId },
  });
  const Icon = iconForComponent(data.component.slug);

  return (
    <div
      ref={setNodeRef}
      aria-label={`Slot filled with ${data.component.label}`}
      className={cn(
        'relative min-w-40 rounded-lg border bg-[var(--slot-filled)] px-4 py-3 shadow-sm',
        'border-[var(--slot-correct)]/40 text-[var(--text-primary)] transition-colors',
        (selected || isOver) && 'ring-2 ring-[var(--slot-correct)]/30',
      )}
    >
      <NodeHandles />
      <button
        type="button"
        onClick={() => data.onClear(data.slotId)}
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-sm hover:text-[var(--slot-incorrect)]"
        aria-label={`Clear ${data.component.label}`}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <AnimatePresence mode="wait">
        <motion.div
          key={data.component.slug}
          initial={prefersReduced ? undefined : scaleIn.initial}
          animate={prefersReduced ? undefined : scaleIn.animate}
          transition={spring}
          className="flex items-center gap-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--slot-correct)]/10 text-[var(--slot-correct)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{data.component.label}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function ActorNode({ data, selected }: NodeProps<Node<ActorCanvasData, 'actor'>>) {
  return (
    <div
      aria-label={`${data.label} actor`}
      className={cn(
        'min-w-28 rounded-full border bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] shadow-sm',
        'border-[var(--accent-primary)]/30',
        selected && 'ring-2 ring-[var(--accent-primary)]/25',
      )}
    >
      <NodeHandles />
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          <ActorIcon />
        </span>
        <span className="text-sm font-semibold">{data.label}</span>
      </div>
    </div>
  );
}
