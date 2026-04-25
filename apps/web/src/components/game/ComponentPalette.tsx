'use client';

import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentType } from '@joy/shared-types';
import { cn } from '@/lib/utils';
import { iconForComponent } from './component-icons';

export const componentDragId = (slug: string) => `component:${slug}`;

interface ComponentPaletteProps {
  components: ComponentType[];
}

function DraggableComponentChip({ component }: { component: ComponentType }) {
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
        'flex w-full items-center gap-3 rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] px-3 py-2 text-left shadow-sm',
        'transition-colors hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/5',
        isDragging && 'opacity-60',
      )}
      title={component.description}
      {...listeners}
      {...attributes}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{component.label}</span>
        <span className="block truncate text-xs text-[var(--text-secondary)]">{component.category}</span>
      </span>
    </button>
  );
}

export function ComponentPalette({ components }: ComponentPaletteProps) {
  const grouped = useMemo(() => {
    return components.reduce<Record<string, ComponentType[]>>((acc, component) => {
      acc[component.category] = [...(acc[component.category] ?? []), component];
      return acc;
    }, {});
  }, [components]);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] lg:w-80">
      <div className="border-b border-[var(--text-primary)]/10 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Components</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Drag a chip onto any blank slot.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((component) => (
                <DraggableComponentChip key={component.id} component={component} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
