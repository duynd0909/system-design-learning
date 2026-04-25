'use client';

import { useDraggable } from '@dnd-kit/core';
import { useReducedMotion } from 'motion/react';
import type { ComponentType } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';
import { iconForComponent } from './component-icons';

export const componentDragId = (slug: string) => `component:${slug}`;

interface ChipProps {
  component: ComponentType;
  isPlaced: boolean;
}

function DraggableChip({ component, isPlaced }: ChipProps) {
  const prefersReduced = useReducedMotion();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: componentDragId(component.slug),
    data: { componentSlug: component.slug },
  });
  const Icon = iconForComponent(component.slug);

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        'flex shrink-0 flex-col items-center gap-1 rounded-xl border border-[var(--text-primary)]/10',
        'bg-[var(--bg-primary)] px-3 pb-2 pt-2.5 shadow-sm',
        'transition-all hover:border-[var(--accent-primary)]/40 hover:shadow-md',
        isDragging && !prefersReduced && 'scale-110 shadow-xl opacity-70',
        isPlaced && 'opacity-50',
      )}
      title={component.description}
      aria-label={`Drag ${component.label} onto a blank slot`}
      {...listeners}
      {...attributes}
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="max-w-[68px] truncate text-center text-[11px] font-medium leading-tight text-[var(--text-primary)]">
        {component.label}
      </span>
    </button>
  );
}

interface ComponentPaletteProps {
  components: ComponentType[];
  placedSlugs: Set<string>;
}

export function ComponentPalette({ components, placedSlugs }: ComponentPaletteProps) {
  return (
    <div
      aria-label="Component palette — drag chips onto blank slots"
      className="flex h-20 shrink-0 items-center gap-3 overflow-x-auto border-t border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        Components
      </span>
      <div className="flex gap-2">
        {components.map((component) => (
          <DraggableChip
            key={component.id}
            component={component}
            isPlaced={placedSlugs.has(component.slug)}
          />
        ))}
      </div>
    </div>
  );
}
