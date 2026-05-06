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
  isGlowMode?: boolean;
}

export interface BlankSlotData extends Record<string, unknown> {
  slotId: string;
  hint?: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  visualState?: GraphNodeVisualState;
  onSelectSlot?: (slotId: string) => void;
  isGlowMode?: boolean;
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
  isGlowMode?: boolean;
}

export interface ActorCanvasData extends Record<string, unknown> {
  label: string;
  visualState?: GraphNodeVisualState;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSimulationActive?: boolean;
  isGlowMode?: boolean;
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
  glowMode?: boolean;
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

export const GraphNodeShell = forwardRef<HTMLDivElement, GraphNodeShellProps>(function GraphNodeShell({
  category,
  visualState = 'idle',
  selected = false,
  highlighted = false,
  dimmed = false,
  glowMode = false,
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
        'relative rounded-xl border-2 bg-[var(--slot-filled)] text-[var(--text-primary)]',
        'group/node',
        'transition-[border-color,box-shadow,opacity,background-color,transform] duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--node-accent)]/35',
        variant === 'expanded' ? 'w-[156px] px-3 py-4' : 'w-[140px] px-3 py-3',
        interactive && 'cursor-pointer',
        dimmed && 'opacity-35',
        glowMode && 'hover:scale-110',
        stateClasses[effectiveState],
        className,
      )}
      style={{
        '--node-accent': categoryStyle.accent,
        borderColor: effectiveState === 'idle' ? categoryStyle.border : undefined,
        boxShadow: glowMode || highlighted || selected
          ? `0 14px 34px ${categoryStyle.glow}`
          : undefined,
        ...style,
      } as CSSProperties}
    >
      {children}
    </div>
  );
});

const HANDLE_CLS = '!absolute !h-0 !w-0 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0 !p-0';

// React Flow keeps source and target handles in separate collections,
// so the same id can exist for both types simultaneously.
// This lets each side be used as either sourceHandle or targetHandle.
export function NodeHandles() {
  return (
    <>
      <Handle id="left"   type="source" position={Position.Left}   isConnectable={false} className={HANDLE_CLS} />
      <Handle id="right"  type="source" position={Position.Right}  isConnectable={false} className={HANDLE_CLS} />
      <Handle id="top"    type="source" position={Position.Top}    isConnectable={false} className={HANDLE_CLS} />
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} className={HANDLE_CLS} />
      <Handle id="left"   type="target" position={Position.Left}   isConnectable={false} className={HANDLE_CLS} />
      <Handle id="right"  type="target" position={Position.Right}  isConnectable={false} className={HANDLE_CLS} />
      <Handle id="top"    type="target" position={Position.Top}    isConnectable={false} className={HANDLE_CLS} />
      <Handle id="bottom" type="target" position={Position.Bottom} isConnectable={false} className={HANDLE_CLS} />
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
      glowMode={data.isGlowMode}
      variant={expanded ? 'expanded' : 'compact'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHandles />
      <div className="flex flex-col items-center gap-2 py-1">
        <span
          className={cn(
            'grid h-11 w-11 place-items-center rounded-xl border-2',
            categoryStyle.bgClass,
            categoryStyle.borderClass,
            categoryStyle.textClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="text-center">
          <div className="text-sm font-semibold leading-tight">{data.label}</div>
        </div>
      </div>

      {expanded && data.description && (
        <p className="mt-2 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
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
      glowMode={data.isGlowMode}
      interactive
      onClick={() => data.onSelectSlot?.(data.slotId)}
      ref={setNodeRef}
      className={cn(
        'group relative grid min-h-[120px] place-items-center bg-[var(--slot-blank)]/8 text-[var(--slot-blank)]',
        !prefersReduced && !isOver && 'animate-slot-pulse',
        (isSelected || isOver) && 'border-solid bg-[var(--slot-blank)]/15',
      )}
      style={isOver ? {
        boxShadow: '0 0 16px rgba(249, 115, 22, 0.6)',
      } : undefined}
    >
      <NodeHandles />
      {data.hint && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-secondary)] p-2 text-xs text-[var(--text-primary)] shadow-lg group-hover:block">
          {data.hint}
        </div>
      )}
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
      glowMode={data.isGlowMode}
      interactive
      onClick={() => data.onSelectSlot?.(data.slotId)}
      ref={setNodeRef}
    >
      <NodeHandles />
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
          className="flex flex-col items-center gap-2 py-1"
        >
          <span
            className={cn(
              'grid h-11 w-11 place-items-center rounded-xl border-2',
              categoryStyle.bgClass,
              categoryStyle.borderClass,
              categoryStyle.textClass,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="text-center">
            <div className="text-sm font-semibold leading-tight">{data.component.label}</div>
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
      glowMode={data.isGlowMode}
      className="bg-[var(--bg-primary)]"
    >
      <NodeHandles />
      <div className="flex flex-col items-center gap-2 py-1">
        <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          <ActorIcon />
        </span>
        <span className="text-sm font-semibold leading-tight">{data.label}</span>
      </div>
    </GraphNodeShell>
  );
}
