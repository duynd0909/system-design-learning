'use client';

import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useReducedMotion } from 'motion/react';
import { Blocks, Check, Cpu, Database, Network, Search, ShieldCheck } from 'lucide-react';
import type { ComponentType } from '@stackdify/shared-types';
import { cn } from '@/lib/utils';
import { iconForComponent } from './component-icons';
import {
  COMPONENT_CATEGORY_ORDER,
  categoryForComponent,
  getCategoryStyle,
  type ComponentSemanticCategory,
} from './graph-config';

export const componentDragId = (slug: string) => `component:${slug}`;

interface ChipProps {
  component: ComponentType;
  isPlaced: boolean;
  layout?: 'grid' | 'rail';
  onClick?: (componentSlug: string) => void;
}

const categoryIcons: Record<ComponentSemanticCategory, typeof Network> = {
  networking: Network,
  compute: Cpu,
  storage: Database,
  async: Blocks,
  security: ShieldCheck,
};

function DraggableChip({ component, isPlaced, layout = 'rail', onClick }: ChipProps) {
  const prefersReduced = useReducedMotion();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: componentDragId(component.slug),
    data: { componentSlug: component.slug },
  });
  const Icon = iconForComponent(component.slug);
  const category = categoryForComponent(component);
  const categoryStyle = getCategoryStyle(category);
  const isRail = layout === 'rail';

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick?.(component.slug)}
      className={cn(
        'group cursor-grab rounded-lg border bg-[var(--bg-primary)] shadow-sm outline-none',
        'transition-[border-color,box-shadow,opacity,background-color] duration-200 active:cursor-grabbing',
        'focus-visible:ring-2 focus-visible:ring-[#00ffa3]/30',
        categoryStyle.borderClass,
        isRail
          ? 'flex min-h-[68px] w-[92px] shrink-0 flex-col items-center justify-center gap-1.5 px-2 py-2'
          : 'flex min-h-[82px] w-full items-start gap-3 p-3 text-left',
        isDragging && !prefersReduced && 'scale-110 shadow-xl opacity-70',
        isPlaced && 'opacity-55',
      )}
      title={component.description}
      aria-label={`Add ${component.label}`}
      {...listeners}
      {...attributes}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-md border transition-colors',
          categoryStyle.bgClass,
          categoryStyle.borderClass,
          categoryStyle.textClass,
          'group-hover:bg-[var(--bg-secondary)]',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {isRail ? (
        <span className="max-w-[76px] truncate text-center text-[11px] font-semibold leading-tight text-[var(--text-primary)]">
          {component.label}
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold leading-tight text-[var(--text-primary)]">
              {component.label}
            </span>
            {isPlaced && (
              <Check className="h-3.5 w-3.5 shrink-0 text-[var(--slot-correct)]" aria-hidden="true" />
            )}
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[var(--text-secondary)]">
            {component.description}
          </span>
        </span>
      )}
    </button>
  );
}

interface ComponentPaletteProps {
  components: ComponentType[];
  placedSlugs: Set<string>;
  variant?: 'rail' | 'panel';
  onComponentClick?: (componentSlug: string) => void;
}

export function ComponentPalette({ components, placedSlugs, variant = 'rail', onComponentClick }: ComponentPaletteProps) {
  const [query, setQuery] = useState('');
  const groupedComponents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = components.filter((component) => {
      if (!normalizedQuery) return true;
      return [
        component.label,
        component.slug,
        component.category,
        component.description,
        getCategoryStyle(categoryForComponent(component)).label,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });

    return COMPONENT_CATEGORY_ORDER.map((category) => ({
      category,
      components: filtered.filter((component) => categoryForComponent(component) === category),
    })).filter((group) => group.components.length > 0);
  }, [components, query]);

  if (variant === 'panel') {
    return (
      <div aria-label="Component palette" className="space-y-4">
        <label className="relative block">
          <span className="sr-only">Search components</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components"
            className="h-10 w-full rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)]/70 focus:border-[#00ffa3]/50 focus:ring-2 focus:ring-[#00ffa3]/15"
          />
        </label>

        {groupedComponents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--text-primary)]/15 bg-[var(--bg-primary)]/50 px-3 py-6 text-center text-sm text-[var(--text-secondary)]">
            No components found.
          </div>
        ) : (
          groupedComponents.map(({ category, components: groupComponents }) => {
            const style = getCategoryStyle(category);
            const CategoryIcon = categoryIcons[category];

            return (
              <section key={category} className="space-y-2" aria-label={`${style.label} components`}>
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn('grid h-6 w-6 place-items-center rounded-md', style.bgClass, style.textClass)}>
                      <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                      {style.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-[var(--text-secondary)]">
                    {groupComponents.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {groupComponents.map((component) => (
                    <DraggableChip
                      key={component.id}
                      component={component}
                      isPlaced={placedSlugs.has(component.slug)}
                      layout="grid"
                      onClick={onComponentClick}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div
      aria-label="Component palette"
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
            layout="rail"
            onClick={onComponentClick}
          />
        ))}
      </div>
    </div>
  );
}
