'use client';

import type { CSSProperties, ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import type { ComponentType } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';
import { scaleIn, spring } from '@/lib/animations';
import { ActorIcon, iconForComponent } from './component-icons';
import {
  categoryForComponent,
  getCategoryStyle,
  getPortLabels,
  normalizeComponentCategory,
  type ComponentSemanticCategory,
  type GraphNodeVisualState,
} from './graph-config';

export const slotDropId = (slotId: string) => `slot:${slotId}`;

export interface ComponentCanvasData extends Record<string, unknown> {
  componentSlug: string;
  category?: string;
  label: string;
  description?: string;
  visualState?: GraphNodeVisualState;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSimulationActive?: boolean;
}

export interface BlankSlotData extends Record<string, unknown> {
  slotId: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  visualState?: GraphNodeVisualState;
  onSelectSlot?: (slotId: string) => void;
}

export interface FilledSlotData extends Record<string, unknown> {
  slotId: string;
  component: ComponentType;
  onClear: (slotId: string) => void;
  onSelectSlot?: (slotId: string) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSimulationActive?: boolean;
  visualState?: GraphNodeVisualState;
}

export interface ActorCanvasData extends Record<string, unknown> {
  label: string;
  visualState?: GraphNodeVisualState;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSimulationActive?: boolean;
}

export type GameFlowNode =
  | Node<ComponentCanvasData, 'component'>
  | Node<BlankSlotData, 'blankSlot'>
  | Node<FilledSlotData, 'filledSlot'>
  | Node<ActorCanvasData, 'actor'>;

interface GraphNodeShellProps {
  category: ComponentSemanticCategory;
  visualState?: GraphNodeVisualState;
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  variant?: 'compact' | 'expanded';
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
  children: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const stateClasses: Record<GraphNodeVisualState, string> = {
  idle: '',
  hover: 'border-[var(--node-accent)]/60 shadow-md',
  selected: 'border-[var(--node-accent)] shadow-lg ring-2 ring-[var(--node-accent)]/20',
  valid: 'border-[var(--slot-correct)] shadow-md ring-2 ring-[var(--slot-correct)]/20',
  warning: 'border-amber-400 shadow-md ring-2 ring-amber-400/20',
  error: 'border-[var(--slot-incorrect)] shadow-md ring-2 ring-[var(--slot-incorrect)]/20',
  processing: 'border-[var(--node-accent)] shadow-lg ring-2 ring-[var(--node-accent)]/25',
  'missing-config': 'border-dashed border-[var(--slot-blank)] shadow-sm',
};

const GraphNodeShell = forwardRef<HTMLDivElement, GraphNodeShellProps>(function GraphNodeShell({
  category,
  visualState = 'idle',
  selected = false,
  highlighted = false,
  dimmed = false,
  variant = 'compact',
  interactive = false,
  className,
  style,
  ariaLabel,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
}, ref) {
  const categoryStyle = getCategoryStyle(category);
  const effectiveState: GraphNodeVisualState = selected
    ? 'selected'
    : highlighted
      ? 'processing'
      : visualState;

  return (
    <div
      aria-label={ariaLabel}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive || !onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref}
      className={cn(
        'relative rounded-lg border bg-[var(--slot-filled)] text-[var(--text-primary)]',
        'group/node',
        'transition-[border-color,box-shadow,opacity,background-color] duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--node-accent)]/35',
        variant === 'expanded' ? 'min-w-48 px-4 py-3.5' : 'min-w-40 px-4 py-3',
        interactive && 'cursor-pointer',
        dimmed && 'opacity-35',
        stateClasses[effectiveState],
        className,
      )}
      style={{
        '--node-accent': categoryStyle.accent,
        borderColor: effectiveState === 'idle' ? categoryStyle.border : undefined,
        boxShadow: highlighted || selected
          ? `0 14px 34px ${categoryStyle.glow}`
          : undefined,
        ...style,
      } as CSSProperties}
    >
      {children}
    </div>
  );
});

function PortHandle({
  type,
  position,
  label,
  category: _category,
}: {
  type: 'source' | 'target';
  position: Position.Left | Position.Right;
  label: string;
  category: ComponentSemanticCategory;
}) {
  const isLeft = position === Position.Left;

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-1/2 z-20 flex -translate-y-1/2 items-center',
        isLeft ? 'left-0 flex-row-reverse' : 'right-0',
      )}
    >
      <Handle
        type={type}
        position={position}
        className="!absolute !left-auto !right-auto !top-auto !h-0 !w-0 !translate-x-0 !translate-y-0 !border-0 !bg-transparent !opacity-0"
        aria-label={label}
      />
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-full',
          'border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] px-2 py-1 text-[10px] font-semibold',
          'text-[var(--text-primary)] opacity-0 shadow-lg transition-opacity duration-150 group-hover/node:opacity-100',
          isLeft ? 'right-2' : 'left-2',
        )}
      >
        {label}
      </span>
    </div>
  );
}

function NodeHandles({ category }: { category: ComponentSemanticCategory }) {
  const labels = getPortLabels(category);
  return (
    <>
      <PortHandle type="target" position={Position.Left} label={labels.input} category={category} />
      <PortHandle type="source" position={Position.Right} label={labels.output} category={category} />
    </>
  );
}

export function ComponentNode({ data, selected }: NodeProps<Node<ComponentCanvasData, 'component'>>) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconForComponent(data.componentSlug);
  const category = normalizeComponentCategory(data.category, data.componentSlug);
  const categoryStyle = getCategoryStyle(category);
  const expanded = hovered || selected;

  return (
    <GraphNodeShell
      ariaLabel={`${data.label} component node`}
      category={category}
      visualState={data.isSimulationActive ? 'processing' : data.visualState}
      selected={selected}
      highlighted={data.isHighlighted}
      dimmed={data.isDimmed}
      variant={expanded ? 'expanded' : 'compact'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHandles category={category} />
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-md border',
            categoryStyle.bgClass,
            categoryStyle.borderClass,
            categoryStyle.textClass,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{data.label}</div>
          <div className="truncate text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {data.componentSlug}
          </div>
        </div>
      </div>

      {expanded && data.description && (
        <p className="mt-2 max-w-56 text-xs leading-relaxed text-[var(--text-secondary)]">
          {data.description}
        </p>
      )}
    </GraphNodeShell>
  );
}

export function BlankSlotNode({ data, selected }: NodeProps<Node<BlankSlotData, 'blankSlot'>>) {
  const prefersReduced = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(data.slotId),
    data: { slotId: data.slotId },
  });
  const isSelected = selected || data.isSelected;

  return (
    <GraphNodeShell
      ariaLabel="Blank slot - drop or click a component to fill it"
      category="async"
      visualState={isOver ? 'valid' : 'missing-config'}
      selected={isSelected}
      highlighted={data.isHighlighted}
      dimmed={data.isDimmed}
      interactive
      onClick={() => data.onSelectSlot?.(data.slotId)}
      ref={setNodeRef}
      className={cn(
        'grid min-h-24 place-items-center bg-[var(--slot-blank)]/8 text-[var(--slot-blank)]',
        !prefersReduced && !isOver && 'animate-slot-pulse',
        (isSelected || isOver) && 'border-solid bg-[var(--slot-blank)]/15',
      )}
      style={isOver ? {
        boxShadow: '0 0 16px rgba(249, 115, 22, 0.6)',
      } : undefined}
    >
      <NodeHandles category="async" />
      <div className="text-center">
        <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--slot-blank)]/15 opacity-40">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>
        <div className="text-sm font-semibold">Drop here</div>
        {isSelected && (
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Selected
          </div>
        )}
      </div>
    </GraphNodeShell>
  );
}

export function FilledSlotNode({ data, selected }: NodeProps<Node<FilledSlotData, 'filledSlot'>>) {
  const prefersReduced = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(data.slotId),
    data: { slotId: data.slotId },
  });
  const Icon = iconForComponent(data.component.slug);
  const category = categoryForComponent(data.component);
  const categoryStyle = getCategoryStyle(category);
  const isSelected = selected || data.isSelected;

  return (
    <GraphNodeShell
      ariaLabel={`Slot filled with ${data.component.label}`}
      category={category}
      visualState={data.isSimulationActive ? 'processing' : data.visualState ?? 'valid'}
      selected={isSelected}
      highlighted={data.isHighlighted || isOver}
      dimmed={data.isDimmed}
      interactive
      onClick={() => data.onSelectSlot?.(data.slotId)}
      ref={setNodeRef}
    >
      <NodeHandles category={category} />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          data.onClear(data.slotId);
        }}
        className="nodrag nopan absolute -right-2 -top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-sm transition-colors hover:text-[var(--slot-incorrect)]"
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
          <span
            className={cn(
              'grid h-9 w-9 place-items-center rounded-md border',
              categoryStyle.bgClass,
              categoryStyle.borderClass,
              categoryStyle.textClass,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{data.component.label}</div>
            <div className="truncate text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
              {categoryStyle.label}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </GraphNodeShell>
  );
}

export function ActorNode({ data, selected }: NodeProps<Node<ActorCanvasData, 'actor'>>) {
  const isActive = data.isSimulationActive || data.isHighlighted;

  return (
    <GraphNodeShell
      ariaLabel={`${data.label} actor`}
      category="networking"
      visualState={isActive ? 'processing' : data.visualState}
      selected={selected}
      highlighted={data.isHighlighted}
      dimmed={data.isDimmed}
      className="min-w-32 rounded-full bg-[var(--bg-primary)]"
    >
      <NodeHandles category="networking" />
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          <ActorIcon />
        </span>
        <span className="text-sm font-semibold">{data.label}</span>
      </div>
    </GraphNodeShell>
  );
}
