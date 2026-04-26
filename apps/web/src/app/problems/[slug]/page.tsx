'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
import { ArrowRight, CheckCircle2, ChevronLeft, Clock, Network, RotateCcw, Send, XCircle } from 'lucide-react';
import type {
  ActorNodeData,
  ComponentNodeData,
  ComponentType,
  Difficulty,
  MaskedNode,
  Requirement,
  SubmissionResponse,
} from '@stackdify/shared-types';
import { Button } from '@/components/ui/Button';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { useProblemDetail, useRequirementGraph, useProblems, useSubmit } from '@/lib/api';
import {
  ActorNode,
  BlankSlotNode,
  ComponentNode,
  FilledSlotNode,
  type GameFlowNode,
} from '@/components/game/GameNodes';
import { LabelEdge } from '@/components/game/LabelEdge';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { RequirementsSidebar } from '@/components/game/RequirementsSidebar';
import { iconForComponent } from '@/components/game/component-icons';
import { cn } from '@/lib/utils';
import { scaleIn, spring } from '@/lib/animations';
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
  return 'label' in data && !('componentSlug' in data) && !('isBlank' in data);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Game Header (LeetCode-style compact bar) ────────────────────────────────

interface GameHeaderProps {
  problem: { title: string; difficulty: Difficulty } | null;
  requirements: Requirement[];
  currentOrder: number;
  completedOrders: Set<number>;
  elapsedSeconds: number;
  filledCount: number;
  slotCount: number;
  isReadyToSubmit: boolean;
  isSubmitting: boolean;
  isFetching: boolean;
  submitError: string;
  isAuthenticated: boolean;
  isReady: boolean;
  onSubmit: () => void;
}

function GameHeader({
  problem,
  requirements,
  currentOrder,
  completedOrders,
  elapsedSeconds,
  filledCount,
  slotCount,
  isReadyToSubmit,
  isSubmitting,
  isFetching,
  submitError,
  isAuthenticated,
  isReady,
  onSubmit,
}: GameHeaderProps) {
  const prefersReduced = useReducedMotion();

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-3">
      {/* Left: logo → back → problem title */}
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/" aria-label="Go to Stackdify home" className="flex shrink-0 items-center gap-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="hidden bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-display text-sm font-bold text-transparent sm:block dark:from-indigo-300 dark:to-purple-300">
            Stackdify
          </span>
        </Link>

        <span className="select-none text-[var(--text-primary)]/20" aria-hidden="true">/</span>

        <Link
          href="/problems"
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Problems
        </Link>

        {problem && (
          <>
            <span className="hidden select-none text-[var(--text-primary)]/20 sm:block" aria-hidden="true">/</span>
            <span className="hidden max-w-[180px] truncate text-sm font-semibold text-[var(--text-primary)] sm:block">
              {problem.title}
            </span>
            <DifficultyBadge difficulty={problem.difficulty} />
          </>
        )}
      </div>

      {/* Center: requirement progress dots */}
      {requirements.length > 0 && (
        <div
          className="flex shrink-0 items-center gap-1.5"
          role="group"
          aria-label={`Requirement progress: ${currentOrder} of ${requirements.length}`}
        >
          {requirements.map((req) => {
            const isCompleted = completedOrders.has(req.order);
            const isActive = req.order === currentOrder;
            return (
              <span
                key={req.order}
                aria-label={
                  isCompleted
                    ? `Requirement ${req.order} complete`
                    : isActive
                      ? `Requirement ${req.order} active`
                      : `Requirement ${req.order} locked`
                }
                className={cn(
                  'h-2 w-2 rounded-full transition-colors duration-300',
                  isCompleted
                    ? 'bg-[var(--slot-correct)]'
                    : isActive
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--text-primary)]/20',
                )}
              />
            );
          })}
          <span className="ml-0.5 text-xs font-medium tabular-nums text-[var(--text-secondary)]">
            {currentOrder}/{requirements.length}
          </span>
        </div>
      )}

      {/* Right: timer + slots + submit */}
      <div className="flex shrink-0 items-center gap-2">
        {!isAuthenticated && isReady && (
          <Link
            href="/login"
            className="hidden text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)] lg:block"
          >
            Sign in to save XP
          </Link>
        )}

        <div
          className="flex items-center gap-1 rounded-md bg-[var(--text-primary)]/5 px-2 py-1 font-mono text-xs text-[var(--text-secondary)]"
          aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span aria-live="off">{formatTime(elapsedSeconds)}</span>
        </div>

        <span className="hidden text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {filledCount}/{slotCount}
        </span>

        {submitError && (
          <p className="hidden max-w-[160px] truncate text-xs text-red-500 md:block" role="alert">
            {submitError}
          </p>
        )}

        <div className={cn(isReadyToSubmit && !prefersReduced && 'animate-submit-pulse')}>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={!isReadyToSubmit || isSubmitting || isFetching}
            title={!isReadyToSubmit ? 'Fill all slots to submit' : undefined}
            className={cn(
              'h-8 rounded-lg px-3 text-xs',
              isReadyToSubmit && 'bg-gradient-to-r from-[var(--accent-primary)] to-[#6366f1] shadow-sm shadow-indigo-500/20',
            )}
          >
            {!isSubmitting && <Send className="h-3 w-3" aria-hidden="true" />}
            {isReadyToSubmit ? 'Submit' : 'Fill slots'}
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Palette Drag Overlay ────────────────────────────────────────────────────

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

// ─── Compact Inline Result (mid-requirements) ────────────────────────────────

interface CompactResultProps {
  result: SubmissionResponse;
  onNext: () => void;
  onRetry: () => void;
  requirementTitle: string;
}

function CompactResult({ result, onNext, onRetry, requirementTitle }: CompactResultProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={prefersReduced ? undefined : scaleIn.initial}
      animate={prefersReduced ? undefined : scaleIn.animate}
      transition={spring}
      className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-md rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] p-4 shadow-xl"
    >
      <div className="flex items-center gap-3">
        {result.passed ? (
          <CheckCircle2 className="h-8 w-8 shrink-0 text-[var(--slot-correct)]" aria-hidden="true" />
        ) : (
          <XCircle className="h-8 w-8 shrink-0 text-[var(--slot-incorrect)]" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--text-primary)]">
            {result.passed ? `${requirementTitle} — done!` : 'Not quite'}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Score: {result.score}%{result.passed ? ` · +${result.xpEarned} XP` : ''}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {result.passed ? (
            <Button type="button" size="sm" onClick={onNext}>
              Next
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProblemGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated, isReady } = useAuth();

  const { data: problemDetail, isLoading: isProblemLoading, isError: isProblemError } = useProblemDetail(slug);
  const { data: problems } = useProblems();

  const [currentOrder, setCurrentOrder] = useState(1);
  const [completedOrders, setCompletedOrders] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeSlug, setActiveSlug] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [submitError, setSubmitError] = useState('');

  const { data: reqGraph, isLoading: isGraphLoading, isFetching } = useRequirementGraph(slug, currentOrder);
  const submit = useSubmit(token);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Reset when moving to a new requirement
  useEffect(() => {
    setAnswers({});
    setResult(null);
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, [currentOrder]);

  // Elapsed timer — stops while result is showing
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, result]);

  const componentBySlug = useMemo(
    () => new Map((problemDetail?.componentTypes ?? []).map((c) => [c.slug, c])),
    [problemDetail?.componentTypes],
  );

  const slotIds = useMemo(
    () => reqGraph?.nodes.filter((n) => n.type === 'blank').map((n) => n.id) ?? [],
    [reqGraph?.nodes],
  );

  const filledCount = slotIds.filter((id) => answers[id]).length;
  const isReadyToSubmit = slotIds.length > 0 && filledCount === slotIds.length;
  const placedSlugs = useMemo(() => new Set(Object.values(answers)), [answers]);

  const nextProblemSlug = useMemo(() => {
    if (!problems || !problemDetail) return null;
    const idx = problems.findIndex((p) => p.slug === problemDetail.problem.slug);
    return idx >= 0 && idx < problems.length - 1 ? problems[idx + 1].slug : null;
  }, [problems, problemDetail]);

  const clearSlot = useCallback((slotId: string) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
    setSubmitError('');
  }, []);

  const flowNodes = useMemo<GameFlowNode[]>(() => {
    if (!reqGraph) return [];
    return reqGraph.nodes.map((node): GameFlowNode => {
      if (node.type === 'blank') {
        const selected = componentBySlug.get(answers[node.id]);
        if (selected) {
          return {
            id: node.id,
            type: 'filledSlot',
            position: node.position,
            data: { slotId: node.id, component: selected, onClear: clearSlot },
          };
        }
        return { id: node.id, type: 'blankSlot', position: node.position, data: { slotId: node.id } };
      }
      if (node.type === 'actor' && isActorData(node.data)) {
        return { id: node.id, type: 'actor', position: node.position, data: { label: node.data.label } };
      }
      if (isComponentData(node.data)) {
        return {
          id: node.id,
          type: 'component',
          position: node.position,
          data: { componentSlug: node.data.componentSlug, label: node.data.label, description: node.data.description },
        };
      }
      return { id: node.id, type: 'actor', position: node.position, data: { label: 'Actor' } };
    });
  }, [answers, clearSlot, componentBySlug, reqGraph]);

  const flowEdges = useMemo<Edge[]>(
    () =>
      reqGraph?.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'label',
        animated: edge.animated,
        style: { stroke: 'var(--text-secondary)', strokeWidth: 2 },
      })) ?? [],
    [reqGraph?.edges],
  );

  const showMinimap = flowNodes.length > 8;

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
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!problemDetail || !isReadyToSubmit) return;

    setSubmitError('');
    try {
      const response = await submit.mutateAsync({
        problemId: problemDetail.problem.id,
        requirementOrder: currentOrder,
        slotAnswers: answers,
        timeTakenMs: Math.max(Date.now() - startedAt, 1),
      });
      setResult(response);
      if (response.passed) {
        setCompletedOrders((prev) => new Set(prev).add(currentOrder));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submissions', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your answer.');
    }
  }, [answers, currentOrder, isAuthenticated, isReadyToSubmit, problemDetail, queryClient, router, startedAt, submit]);

  const handleNextRequirement = useCallback(() => {
    if (!reqGraph) return;
    setCurrentOrder(currentOrder + 1);
    setResult(null);
  }, [currentOrder, reqGraph]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setAnswers({});
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, []);

  const handleFullRetry = useCallback(() => {
    setResult(null);
    setCurrentOrder(1);
    setCompletedOrders(new Set());
    setAnswers({});
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, []);

  const handleSelectRequirement = useCallback((order: number) => {
    if (completedOrders.has(order)) {
      setCurrentOrder(order);
      setResult(null);
    }
  }, [completedOrders]);

  // ── Sidebar resize ────────────────────────────────────────────────────────
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(300);

  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarContainerRef.current?.offsetWidth ?? 300;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !sidebarContainerRef.current) return;
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(Math.max(dragStartWidth.current + delta, 200), 560);
      sidebarContainerRef.current.style.width = `${next}px`;
    };
    const onMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const activeComponent = componentBySlug.get(activeSlug);
  const currentRequirement = reqGraph?.requirement;
  const isLastRequirement = result?.isLastRequirement ?? false;
  const showFullResult = result !== null && (isLastRequirement || !result.passed);
  const showCompactResult = result !== null && result.passed && !isLastRequirement;

  const isLoading = isProblemLoading || isGraphLoading;
  const isError = isProblemError || (!isGraphLoading && !!problemDetail && !reqGraph);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Compact game header — full width, replaces global Navbar */}
      <GameHeader
        problem={problemDetail?.problem ?? null}
        requirements={problemDetail?.requirements ?? []}
        currentOrder={currentOrder}
        completedOrders={completedOrders}
        elapsedSeconds={elapsedSeconds}
        filledCount={filledCount}
        slotCount={slotIds.length}
        isReadyToSubmit={isReadyToSubmit}
        isSubmitting={submit.isPending}
        isFetching={isFetching}
        submitError={submitError}
        isAuthenticated={isAuthenticated}
        isReady={isReady}
        onSubmit={handleSubmit}
      />

      {isLoading ? (
        <div className="flex flex-1 overflow-hidden">
          <Skeleton className="h-full w-[300px] shrink-0 rounded-none" />
          <div className="flex-1 p-8">
            <Skeleton className="mb-4 h-9 w-72" />
            <Skeleton className="h-[calc(100%-5rem)] w-full rounded-xl" />
          </div>
        </div>
      ) : isError || !problemDetail ? (
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Problem unavailable</h1>
          <p className="mt-3 text-[var(--text-secondary)]">The API could not load this system design problem.</p>
          <Link href="/problems" className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-primary)]">
            Back to problems
          </Link>
        </main>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar — resizable */}
            <div
              ref={sidebarContainerRef}
              style={{ width: 300 }}
              className="shrink-0 overflow-hidden"
            >
              <RequirementsSidebar
                problem={problemDetail.problem}
                requirements={problemDetail.requirements}
                components={problemDetail.componentTypes}
                placedSlugs={placedSlugs}
                currentOrder={currentOrder}
                completedOrders={completedOrders}
                isLoading={isGraphLoading}
                onSelectRequirement={handleSelectRequirement}
              />
            </div>

            {/* Drag splitter */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={handleResizerMouseDown}
              className="group relative flex w-2 shrink-0 cursor-col-resize select-none items-center justify-center"
            >
              <div className="pointer-events-none h-full w-px bg-[var(--text-primary)]/10 transition-colors group-hover:bg-[var(--accent-primary)]/40 group-active:bg-[var(--accent-primary)]/60" />
              <div className="pointer-events-none absolute flex flex-col gap-[3px]">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-[var(--text-primary)]/25 transition-colors group-hover:bg-[var(--accent-primary)]/60" />
                ))}
              </div>
            </div>

            {/* Right: canvas */}
            <section className="relative flex-1 bg-[var(--bg-game-canvas)]">
              <ReactFlowProvider>
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
                      <MiniMap pannable zoomable nodeColor="var(--accent-primary)" maskColor="rgba(0,0,0,0.08)" />
                    )}
                  </ReactFlow>
                </div>
              </ReactFlowProvider>

              {/* Compact result overlay (mid-requirement pass) */}
              <AnimatePresence>
                {showCompactResult && currentRequirement ? (
                  <CompactResult
                    key={`compact-${currentOrder}`}
                    result={result}
                    onNext={handleNextRequirement}
                    onRetry={handleRetry}
                    requirementTitle={currentRequirement.title}
                  />
                ) : null}
              </AnimatePresence>
            </section>
          </div>

          <DragOverlay>
            <PaletteOverlay component={activeComponent} />
          </DragOverlay>
        </DndContext>
      )}

      {/* Full result overlay (last requirement or failure) */}
      <AnimatePresence>
        {showFullResult && problemDetail ? (
          <ResultOverlay
            key={`result-${currentOrder}`}
            result={result}
            componentTypes={problemDetail.componentTypes}
            onRetry={isLastRequirement && result.passed ? handleFullRetry : handleRetry}
            nextProblemSlug={isLastRequirement && result.passed ? nextProblemSlug : undefined}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
