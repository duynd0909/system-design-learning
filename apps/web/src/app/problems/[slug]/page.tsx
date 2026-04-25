'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react';
import { ArrowLeft, Clock, Loader2, Send } from 'lucide-react';
import type {
  ActorNodeData,
  ComponentNodeData,
  ComponentType,
  MaskedNode,
  SubmissionResponse,
} from '@stackdify/shared-types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { useProblem, useProblems, useSubmit } from '@/lib/api';
import {
  ActorNode,
  BlankSlotNode,
  ComponentNode,
  FilledSlotNode,
  type GameFlowNode,
} from '@/components/game/GameNodes';
import { ComponentPalette } from '@/components/game/ComponentPalette';
import { LabelEdge } from '@/components/game/LabelEdge';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { iconForComponent } from '@/components/game/component-icons';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const nodeTypes = {
  actor: ActorNode,
  blankSlot: BlankSlotNode,
  component: ComponentNode,
  filledSlot: FilledSlotNode,
} satisfies NodeTypes;

const edgeTypes = {
  label: LabelEdge,
} satisfies EdgeTypes;

function componentDragSlug(id: string) {
  return id.startsWith('component:') ? id.slice('component:'.length) : '';
}

function slotIdFromDrop(id: string) {
  return id.startsWith('slot:') ? id.slice('slot:'.length) : '';
}

function isComponentData(data: MaskedNode['data']): data is ComponentNodeData {
  return 'componentSlug' in data;
}

function isActorData(data: MaskedNode['data']): data is ActorNodeData {
  return 'label' in data && !('componentSlug' in data);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function PaletteOverlay({ component }: { component: ComponentType | undefined }) {
  if (!component) return null;
  const Icon = iconForComponent(component.slug);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--bg-primary)] px-3 py-2 shadow-xl">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{component.label}</span>
    </div>
  );
}

export default function ProblemGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefersReduced = useReducedMotion();
  const { token, isAuthenticated, isReady } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useProblem(slug);
  const { data: problems } = useProblems();
  const submit = useSubmit(token);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeSlug, setActiveSlug] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [submitError, setSubmitError] = useState('');

  // Elapsed timer — stops when result is shown
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, result]);

  const componentBySlug = useMemo(() => {
    return new Map((data?.componentTypes ?? []).map((component) => [component.slug, component]));
  }, [data?.componentTypes]);

  const slotIds = useMemo(() => {
    return data?.nodes.filter((node) => node.type === 'blank').map((node) => node.id) ?? [];
  }, [data?.nodes]);

  const filledCount = slotIds.filter((slotId) => answers[slotId]).length;
  const isReadyToSubmit = slotIds.length > 0 && filledCount === slotIds.length;

  const placedSlugs = useMemo(() => new Set(Object.values(answers)), [answers]);

  const nextProblemSlug = useMemo(() => {
    if (!problems || !data) return null;
    const idx = problems.findIndex((p) => p.slug === data.problem.slug);
    return idx >= 0 && idx < problems.length - 1 ? problems[idx + 1].slug : null;
  }, [problems, data]);

  const clearSlot = useCallback((slotId: string) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
    setSubmitError('');
  }, []);

  const flowNodes = useMemo<GameFlowNode[]>(() => {
    if (!data) return [];

    return data.nodes.map((node): GameFlowNode => {
      if (node.type === 'blank') {
        const selectedComponent = componentBySlug.get(answers[node.id]);
        if (selectedComponent) {
          return {
            id: node.id,
            type: 'filledSlot',
            position: node.position,
            data: {
              slotId: node.id,
              component: selectedComponent,
              onClear: clearSlot,
            },
          };
        }
        return {
          id: node.id,
          type: 'blankSlot',
          position: node.position,
          data: { slotId: node.id },
        };
      }

      if (node.type === 'actor' && isActorData(node.data)) {
        return {
          id: node.id,
          type: 'actor',
          position: node.position,
          data: { label: node.data.label },
        };
      }

      if (isComponentData(node.data)) {
        return {
          id: node.id,
          type: 'component',
          position: node.position,
          data: {
            componentSlug: node.data.componentSlug,
            label: node.data.label,
            description: node.data.description,
          },
        };
      }

      return {
        id: node.id,
        type: 'actor',
        position: node.position,
        data: { label: 'Actor' },
      };
    });
  }, [answers, clearSlot, componentBySlug, data]);

  const flowEdges = useMemo<Edge[]>(() => {
    return (
      data?.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'label',
        animated: edge.animated,
        style: { stroke: 'var(--text-secondary)', strokeWidth: 2 },
      })) ?? []
    );
  }, [data?.edges]);

  // Show minimap only for larger graphs (> 8 nodes)
  const showMinimap = flowNodes.length > 8;

  useEffect(() => {
    if (!data) return;
    setAnswers({});
    setResult(null);
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, [data]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSlug(componentDragSlug(String(event.active.id)));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const componentSlug = componentDragSlug(String(event.active.id));
    const slotId = event.over ? slotIdFromDrop(String(event.over.id)) : '';

    if (componentSlug && slotId) {
      setAnswers((current) => ({ ...current, [slotId]: componentSlug }));
      setSubmitError('');
    }
    setActiveSlug('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!data || !isReadyToSubmit) return;

    setSubmitError('');
    try {
      const response = await submit.mutateAsync({
        problemId: data.problem.id,
        slotAnswers: answers,
        timeTakenMs: Math.max(Date.now() - startedAt, 1),
      });
      setResult(response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submissions', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your answer.');
    }
  }, [answers, data, isAuthenticated, isReadyToSubmit, queryClient, router, startedAt, submit]);

  const handleRetry = useCallback(async () => {
    setResult(null);
    setAnswers({});
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    await refetch();
  }, [refetch]);

  const activeComponent = componentBySlug.get(activeSlug);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navbar />
      {isLoading ? (
        <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <Skeleton className="mb-4 h-9 w-72" />
          <Skeleton className="h-[620px] w-full rounded-xl" />
        </main>
      ) : isError || !data ? (
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Problem unavailable</h1>
          <p className="mt-3 text-[var(--text-secondary)]">The API could not load this system design problem.</p>
          <Link href="/problems" className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-primary)]">
            Back to problems
          </Link>
        </main>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Main game area: canvas + bottom palette */}
          <main className="flex flex-1 flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            {/* Canvas section */}
            <section className="relative flex-1 bg-[var(--bg-game-canvas)]">
              {/* Floating top bar */}
              <div className="absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)]/90 p-3 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <Link
                    href="/problems"
                    className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Problems
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">{data.problem.title}</h1>
                    <DifficultyBadge difficulty={data.problem.difficulty} />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {filledCount}/{slotIds.length} blanks filled
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Timer */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] px-3 py-1.5 font-mono text-sm text-[var(--text-secondary)]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}>{formatTime(elapsedSeconds)}</span>
                  </div>

                  {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
                  {!isAuthenticated && isReady ? (
                    <p className="text-xs text-[var(--text-secondary)]">Sign in to save XP.</p>
                  ) : null}

                  {/* Submit button: animated pulse border when ready */}
                  <div className={cn(
                    'rounded-lg',
                    isReadyToSubmit && !prefersReduced && 'animate-submit-pulse',
                  )}>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={submit.isPending}
                      disabled={!isReadyToSubmit || submit.isPending || isFetching}
                      title={!isReadyToSubmit ? 'Fill all slots to submit' : undefined}
                      className={cn(
                        isReadyToSubmit && 'bg-gradient-to-r from-[var(--accent-primary)] to-[#6366f1]',
                      )}
                    >
                      {submit.isPending ? null : <Send className="h-4 w-4" aria-hidden="true" />}
                      {isReadyToSubmit ? 'Submit' : 'Fill all slots'}
                    </Button>
                  </div>
                </div>
              </div>

              <ReactFlowProvider>
                {/* absolute inset-0 gives React Flow a measurable width + height */}
                <div className="absolute inset-0">
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    nodesDraggable={false}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.5}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Dots} color="var(--text-secondary)" gap={24} size={1} />
                    <Controls />
                    {showMinimap && (
                      <MiniMap
                        pannable
                        zoomable
                        nodeColor="var(--accent-primary)"
                        maskColor="rgba(0,0,0,0.08)"
                      />
                    )}
                  </ReactFlow>
                </div>
              </ReactFlowProvider>

              {isFetching ? (
                <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-lg bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Refreshing mask
                </div>
              ) : null}
            </section>

            {/* Bottom palette bar */}
            <ComponentPalette components={data.componentTypes} placedSlugs={placedSlugs} />
          </main>

          <DragOverlay>
            <PaletteOverlay component={activeComponent} />
          </DragOverlay>
        </DndContext>
      )}

      <AnimatePresence>
        {result ? (
          <ResultOverlay
            key="result"
            result={result}
            componentTypes={data?.componentTypes ?? []}
            onRetry={handleRetry}
            nextProblemSlug={nextProblemSlug}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
