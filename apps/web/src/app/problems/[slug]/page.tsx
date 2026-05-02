'use client';

import type { ReactNode } from 'react';
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
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock,
  LayoutGrid,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Network,
  Pause,
  Play,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react';
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
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  useProblemDetail,
  useRequirementGraph,
  useProblems,
  useSubmit,
  useShareProblem,
} from '@/lib/api';
import {
  ActorNode,
  BlankSlotNode,
  ComponentNode,
  FilledSlotNode,
  type GameFlowNode,
} from '@/components/game/GameNodes';
import { LabelEdge, type SystemEdgeData } from '@/components/game/LabelEdge';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { RequirementsSidebar } from '@/components/game/RequirementsSidebar';
import { iconForComponent } from '@/components/game/component-icons';
import {
  categoryForComponent,
  edgeStatusStroke,
  getCategoryStyle,
  inferEdgeKind,
  type SystemEdgeStatus,
} from '@/components/game/graph-config';
import {
  autoLayoutGraph,
  emptyConnectedPath,
  getConnectedPath,
  getDirectEdgeNodes,
} from '@/components/game/graph-utils';
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
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
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
  onNavigate: (href: string) => void;
  onShare?: () => Promise<void>;
  isSharing?: boolean;
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
  onNavigate,
  onShare,
  isSharing,
}: GameHeaderProps) {
  const prefersReduced = useReducedMotion();

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-3">
      {/* Left: logo → back → problem title */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Go to Stackdify home"
          onClick={() => onNavigate('/')}
          className="flex shrink-0 items-center gap-1.5 group"
        >
          <div
            className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: '#00ffa3',
              clipPath:
                'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
          <span className="hidden font-display text-sm font-bold text-[var(--text-primary)] sm:block">
            Stackdify
          </span>
        </button>

        <span
          className="select-none text-[var(--text-primary)]/20"
          aria-hidden="true"
        >
          /
        </span>

        <button
          type="button"
          onClick={() => onNavigate('/problems')}
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Problems
        </button>

        {problem && (
          <>
            <span
              className="hidden select-none text-[var(--text-primary)]/20 sm:block"
              aria-hidden="true"
            >
              /
            </span>
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

        {onShare && (
          <button
            type="button"
            onClick={() => void onShare()}
            disabled={isSharing}
            aria-label="Share this challenge"
            className="hidden h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)]/5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--text-primary)]/10 hover:text-[var(--text-primary)] disabled:opacity-50 sm:flex"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        <ThemeToggle className="h-8 w-8 rounded-lg bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10" />

        {submitError && (
          <p
            className="hidden max-w-[160px] truncate text-xs text-red-500 md:block"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <div
          className={cn(
            isReadyToSubmit && !prefersReduced && 'animate-submit-pulse',
          )}
        >
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={!isReadyToSubmit || isSubmitting || isFetching}
            title={!isReadyToSubmit ? 'Fill all slots to submit' : undefined}
            className={cn(
              'h-8 rounded-lg px-3 text-xs',
              isReadyToSubmit &&
                'bg-gradient-to-r from-[var(--accent-primary)] to-[#6366f1] shadow-sm shadow-indigo-500/20',
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

function PaletteOverlay({
  component,
}: {
  component: ComponentType | undefined;
}) {
  if (!component) return null;
  const Icon = iconForComponent(component.slug);
  const categoryStyle = getCategoryStyle(categoryForComponent(component));
  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-[var(--bg-primary)] px-3 py-2 shadow-xl"
      style={{
        borderColor: categoryStyle.border,
        boxShadow: `0 14px 34px ${categoryStyle.glow}`,
      }}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-md border',
          categoryStyle.bgClass,
          categoryStyle.borderClass,
          categoryStyle.textClass,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        {component.label}
      </span>
    </div>
  );
}

function MobileReadOnlyNotice({ title }: { title?: string }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg-game-canvas)] px-4 py-8 md:hidden">
      <section className="w-full max-w-md rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] p-5 shadow-xl">
        <div className="mb-4 overflow-hidden rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-4">
          <div className="relative h-44">
            <div className="absolute left-2 top-14 h-11 w-11 rounded-full bg-[var(--accent-primary)]/90" />
            <div className="absolute left-[34%] top-6 h-14 w-28 rounded-lg border border-[var(--text-primary)]/10 bg-[var(--slot-filled)] shadow-sm" />
            <div className="absolute left-[34%] top-28 h-14 w-28 rounded-lg border-2 border-dashed border-[var(--slot-blank)] bg-[var(--slot-blank)]/10" />
            <div className="absolute right-3 top-20 h-16 w-32 rounded-lg bg-[var(--accent-game)]/90 shadow-sm" />
            <div className="absolute left-[72px] top-[78px] h-1 w-[105px] rotate-[-18deg] rounded bg-[var(--accent-primary)]/45" />
            <div className="absolute left-[72px] top-[98px] h-1 w-[105px] rotate-[18deg] rounded bg-[var(--accent-primary)]/45" />
            <div className="absolute right-[118px] top-[88px] h-1 w-[92px] rotate-[18deg] rounded bg-[var(--accent-game)]/55" />
            <div className="absolute right-[118px] top-[118px] h-1 w-[92px] rotate-[-18deg] rounded bg-[var(--accent-game)]/55" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          Mobile preview
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">
          {title ?? 'System design canvas'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          The interactive graph editor needs more room for dragging, panning,
          and comparing components. Open this problem on a tablet or desktop to
          play.
        </p>
        <Link
          href="/problems"
          className="mt-5 inline-flex text-sm font-semibold text-[var(--accent-primary)]"
        >
          Browse problems
        </Link>
      </section>
    </main>
  );
}

// ─── Compact Inline Result (mid-requirements) ────────────────────────────────

interface CompactResultProps {
  result: SubmissionResponse;
  onNext: () => void;
  onDismiss: () => void;
  onReset: () => void;
  requirementTitle: string;
}

function CompactResult({
  result,
  onNext,
  onDismiss,
  onReset,
  requirementTitle,
}: CompactResultProps) {
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
          <CheckCircle2
            className="h-8 w-8 shrink-0 text-[var(--slot-correct)]"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            className="h-8 w-8 shrink-0 text-[var(--slot-incorrect)]"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--text-primary)]">
            {result.passed
              ? `${requirementTitle} — done!`
              : 'Not quite — fix the highlighted slots'}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Score: {result.score}%
            {result.passed ? ` · +${result.xpEarned} XP` : ''}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {result.passed ? (
            <Button type="button" size="sm" onClick={onNext}>
              Next
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" onClick={onDismiss}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onReset}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface CanvasToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function CanvasToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: CanvasToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-transparent text-[var(--text-secondary)]',
        'transition-colors duration-150 hover:border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active &&
          'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]',
      )}
    >
      {children}
    </button>
  );
}

interface CanvasToolbarProps {
  hasNodes: boolean;
  minimapVisible: boolean;
  snapToGrid: boolean;
  simulationEnabled: boolean;
  onAutoLayout: () => void;
  onFitView: () => void;
  onToggleMinimap: () => void;
  onToggleSnap: () => void;
  onToggleSimulation: () => void;
}

function CanvasToolbar({
  hasNodes,
  minimapVisible,
  snapToGrid,
  simulationEnabled,
  onAutoLayout,
  onFitView,
  onToggleMinimap,
  onToggleSnap,
  onToggleSimulation,
}: CanvasToolbarProps) {
  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)]/95 p-1 shadow-lg backdrop-blur">
      <CanvasToolButton
        label="Auto layout"
        disabled={!hasNodes}
        onClick={onAutoLayout}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </CanvasToolButton>
      <CanvasToolButton
        label="Fit to view"
        disabled={!hasNodes}
        onClick={onFitView}
      >
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </CanvasToolButton>
      <CanvasToolButton
        label="Toggle minimap"
        active={minimapVisible}
        onClick={onToggleMinimap}
      >
        <MapIcon className="h-4 w-4" aria-hidden="true" />
      </CanvasToolButton>
      <CanvasToolButton
        label="Toggle snap to grid"
        active={snapToGrid}
        onClick={onToggleSnap}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
      </CanvasToolButton>
      <CanvasToolButton
        label={simulationEnabled ? 'Pause simulation' : 'Start simulation'}
        active={simulationEnabled}
        disabled={!hasNodes}
        onClick={onToggleSimulation}
      >
        {simulationEnabled ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </CanvasToolButton>
    </div>
  );
}

// ─── Leave Confirmation Modal ────────────────────────────────────────────────

interface LeaveConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function LeaveConfirmModal({
  open,
  onConfirm,
  onCancel,
}: LeaveConfirmModalProps) {
  const prefersReduced = useReducedMotion();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leave problem confirmation"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/45 px-4 backdrop-blur-sm"
    >
      <motion.div
        initial={prefersReduced ? undefined : scaleIn.initial}
        animate={prefersReduced ? undefined : scaleIn.animate}
        transition={spring}
        className="w-full max-w-sm rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] p-6 shadow-xl"
      >
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Leave this problem?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Your current placements will be lost. Progress from completed
          requirements is saved.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            Stay
          </Button>
          <Button type="button" className="flex-1" onClick={onConfirm}>
            Leave
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProblemGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated, isReady } = useAuth();
  const prefersReduced = useReducedMotion();
  const flowInstanceRef = useRef<ReactFlowInstance<
    GameFlowNode,
    Edge<SystemEdgeData>
  > | null>(null);
  const hasRestoredRef = useRef(false);

  const {
    data: problemDetail,
    isLoading: isProblemLoading,
    isError: isProblemError,
  } = useProblemDetail(slug, token || undefined);
  const { data: problems } = useProblems();

  const [currentOrder, setCurrentOrder] = useState(1);
  const [completedOrders, setCompletedOrders] = useState<Set<number>>(
    new Set(),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeSlug, setActiveSlug] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [layoutOverrides, setLayoutOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [hoveredEdgeId, setHoveredEdgeId] = useState('');
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [activeSimulationEdgeId, setActiveSimulationEdgeId] = useState('');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [slotFeedback, setSlotFeedback] = useState<Record<string, boolean>>({});

  const {
    data: reqGraph,
    isLoading: isGraphLoading,
    isFetching,
  } = useRequirementGraph(slug, currentOrder);
  const submit = useSubmit(token);
  const shareProblem = useShareProblem(token || undefined);
  const toastCtx = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Reset when moving to a new requirement
  useEffect(() => {
    setAnswers({});
    setResult(null);
    setSlotFeedback({});
    setSubmitError('');
    setSelectedSlotId('');
    setLayoutOverrides({});
    setHoveredEdgeId('');
    setActiveSimulationEdgeId('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, [currentOrder]);

  // Restore completed requirements from the problem detail response.
  // completedRequirementOrders is embedded by the server when the request is authenticated,
  // so we wait for both the token and a fresh authenticated fetch before restoring.
  useEffect(() => {
    if (hasRestoredRef.current || !problemDetail || !token) return;
    hasRestoredRef.current = true;

    const orders = problemDetail.completedRequirementOrders ?? [];
    if (orders.length === 0) return;

    const passedOrders = new Set(orders);
    setCompletedOrders(passedOrders);
    const totalReqs = problemDetail.requirements.length;
    const nextOrder =
      Array.from({ length: totalReqs }, (_, i) => i + 1).find(
        (o) => !passedOrders.has(o),
      ) ?? totalReqs;
    setCurrentOrder(nextOrder);
  }, [problemDetail, token]);

  // Elapsed timer — stops while result is showing
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, result]);

  // Re-fit the canvas whenever a new requirement graph is ready for the current order.
  //
  // The fitView prop on <ReactFlow> only fires on mount. When the graph changes while
  // the component stays mounted (cached data, restored progress jumping from order 1→3)
  // we must call it manually.
  //
  // We guard with `reqGraph.requirement.order === currentOrder` so a stale cached graph
  // from the previous order never triggers a mis-fit.
  //
  // Double rAF: first frame lets React commit the new nodes to the DOM; second frame
  // lets React Flow finish measuring their dimensions before we call fitView.
  useEffect(() => {
    if (!reqGraph || reqGraph.requirement.order !== currentOrder) return;
    let outer = 0;
    let inner = 0;
    outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        flowInstanceRef.current?.fitView({
          padding: 0.2,
          duration: prefersReduced ? 0 : 400,
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [reqGraph, currentOrder, prefersReduced]);

  const componentBySlug = useMemo(
    () =>
      new Map((problemDetail?.componentTypes ?? []).map((c) => [c.slug, c])),
    [problemDetail?.componentTypes],
  );

  const slotIds = useMemo(
    () =>
      reqGraph?.nodes.filter((n) => n.type === 'blank').map((n) => n.id) ?? [],
    [reqGraph?.nodes],
  );

  const filledCount = slotIds.filter((id) => answers[id]).length;
  const isReadyToSubmit = slotIds.length > 0 && filledCount === slotIds.length;
  const placedSlugs = useMemo(() => new Set(Object.values(answers)), [answers]);
  const remainingSlots = Math.max(slotIds.length - filledCount, 0);

  const nodeSlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of reqGraph?.nodes ?? []) {
      if (node.type === 'blank') {
        const answerSlug = answers[node.id];
        if (answerSlug) map.set(node.id, answerSlug);
        continue;
      }
      if (isComponentData(node.data)) {
        map.set(node.id, node.data.componentSlug);
      }
    }
    return map;
  }, [answers, reqGraph?.nodes]);

  const hoveredPath = useMemo(
    () =>
      hoveredEdgeId
        ? getConnectedPath(hoveredEdgeId, reqGraph?.edges ?? [])
        : emptyConnectedPath(),
    [hoveredEdgeId, reqGraph?.edges],
  );
  const activeSimulationNodes = useMemo(
    () =>
      activeSimulationEdgeId
        ? getDirectEdgeNodes(activeSimulationEdgeId, reqGraph?.edges ?? [])
        : new Set<string>(),
    [activeSimulationEdgeId, reqGraph?.edges],
  );
  const hasHoveredPath = hoveredPath.edgeIds.size > 0;

  const nextProblemSlug = useMemo(() => {
    if (!problems || !problemDetail) return null;
    const idx = problems.findIndex(
      (p) => p.slug === problemDetail.problem.slug,
    );
    return idx >= 0 && idx < problems.length - 1
      ? problems[idx + 1].slug
      : null;
  }, [problems, problemDetail]);

  const clearSlot = useCallback((slotId: string) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
    setSlotFeedback((prev) => {
      if (!(slotId in prev)) return prev;
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setSelectedSlotId(slotId);
    setSubmitError('');
  }, []);

  const flowNodes = useMemo<GameFlowNode[]>(() => {
    if (!reqGraph) return [];
    return reqGraph.nodes.map((node): GameFlowNode => {
      const position = layoutOverrides[node.id] ?? node.position;
      const isHighlighted = hoveredPath.nodeIds.has(node.id);
      const isDimmed = hasHoveredPath && !isHighlighted;
      const isSimulationActive = activeSimulationNodes.has(node.id);

      if (node.type === 'blank') {
        const selected = componentBySlug.get(answers[node.id]);
        if (selected) {
          const fb = slotFeedback[node.id];
          const feedbackState =
            fb === false ? 'error' : fb === true ? 'valid' : undefined;
          return {
            id: node.id,
            type: 'filledSlot',
            position,
            data: {
              slotId: node.id,
              component: selected,
              onClear: clearSlot,
              onSelectSlot: setSelectedSlotId,
              isSelected: selectedSlotId === node.id,
              isHighlighted,
              isDimmed,
              isSimulationActive,
              visualState: feedbackState,
            },
          };
        }
        return {
          id: node.id,
          type: 'blankSlot',
          position,
          data: {
            slotId: node.id,
            onSelectSlot: setSelectedSlotId,
            isSelected: selectedSlotId === node.id,
            isHighlighted,
            isDimmed,
          },
        };
      }
      if (node.type === 'actor' && isActorData(node.data)) {
        return {
          id: node.id,
          type: 'actor',
          position,
          data: {
            label: node.data.label,
            isHighlighted,
            isDimmed,
            isSimulationActive,
          },
        };
      }
      if (isComponentData(node.data)) {
        const component = componentBySlug.get(node.data.componentSlug);
        return {
          id: node.id,
          type: 'component',
          position,
          data: {
            componentSlug: node.data.componentSlug,
            category: component?.category,
            label: node.data.label,
            description: node.data.description ?? component?.description,
            isHighlighted,
            isDimmed,
            isSimulationActive,
          },
        };
      }
      return {
        id: node.id,
        type: 'actor',
        position,
        data: { label: 'Actor', isHighlighted, isDimmed, isSimulationActive },
      };
    });
  }, [
    activeSimulationNodes,
    answers,
    clearSlot,
    componentBySlug,
    hasHoveredPath,
    hoveredPath.nodeIds,
    layoutOverrides,
    reqGraph,
    selectedSlotId,
    slotFeedback,
  ]);

  const handleEdgeHover = useCallback((edgeId: string) => {
    setHoveredEdgeId(edgeId);
  }, []);

  const handleEdgeHoverEnd = useCallback(() => {
    setHoveredEdgeId('');
  }, []);

  const flowEdges = useMemo<Edge<SystemEdgeData>[]>(
    () =>
      reqGraph?.edges.map((edge) => {
        const kind = inferEdgeKind(edge, {
          sourceSlug: nodeSlugById.get(edge.source),
          targetSlug: nodeSlugById.get(edge.target),
        });
        const isActive =
          simulationEnabled && activeSimulationEdgeId === edge.id;
        const isHighlighted = hoveredPath.edgeIds.has(edge.id);
        const isDimmed = hasHoveredPath && !isHighlighted;
        const status: SystemEdgeStatus = isActive ? 'active' : 'normal';
        const color = edgeStatusStroke(kind, status);

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: 'label',
          animated: edge.animated || isActive,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          data: {
            kind,
            status,
            isActive,
            isHighlighted,
            isDimmed,
            onHover: handleEdgeHover,
            onHoverEnd: handleEdgeHoverEnd,
          },
        };
      }) ?? [],
    [
      activeSimulationEdgeId,
      handleEdgeHover,
      handleEdgeHoverEnd,
      hasHoveredPath,
      hoveredPath.edgeIds,
      nodeSlugById,
      reqGraph?.edges,
      simulationEnabled,
    ],
  );

  const showMinimap = isMinimapVisible && flowNodes.length > 0;
  const simulationEdgeIds = useMemo(
    () => reqGraph?.edges.map((edge) => edge.id) ?? [],
    [reqGraph?.edges],
  );

  useEffect(() => {
    if (!simulationEnabled || simulationEdgeIds.length === 0) {
      setActiveSimulationEdgeId('');
      return;
    }

    if (prefersReduced) {
      setActiveSimulationEdgeId(simulationEdgeIds[0]);
      return;
    }

    let index = 0;
    setActiveSimulationEdgeId(simulationEdgeIds[index]);
    const interval = window.setInterval(() => {
      index = (index + 1) % simulationEdgeIds.length;
      setActiveSimulationEdgeId(simulationEdgeIds[index]);
    }, 950);

    return () => window.clearInterval(interval);
  }, [prefersReduced, simulationEdgeIds, simulationEnabled]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSlug(componentDragSlug(String(event.active.id)));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const componentSlug = componentDragSlug(String(event.active.id));
    const slotId = event.over ? slotIdFromDrop(String(event.over.id)) : '';
    if (componentSlug && slotId) {
      setAnswers((current) => ({ ...current, [slotId]: componentSlug }));
      setSelectedSlotId(slotId);
      setSubmitError('');
      setSlotFeedback((prev) => {
        if (!(slotId in prev)) return prev;
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    }
    setActiveSlug('');
  }, []);

  const handleComponentClick = useCallback(
    (componentSlug: string) => {
      const targetSlotId =
        (selectedSlotId && slotIds.includes(selectedSlotId)
          ? selectedSlotId
          : '') ||
        slotIds.find((slotId) => !answers[slotId]) ||
        '';

      if (!targetSlotId) return;

      setAnswers((current) => ({ ...current, [targetSlotId]: componentSlug }));
      setSelectedSlotId(targetSlotId);
      setSubmitError('');
      setSlotFeedback((prev) => {
        if (!(targetSlotId in prev)) return prev;
        const next = { ...prev };
        delete next[targetSlotId];
        return next;
      });
    },
    [answers, selectedSlotId, slotIds],
  );

  const handleFitView = useCallback(() => {
    flowInstanceRef.current?.fitView({
      padding: 0.24,
      duration: prefersReduced ? 0 : 280,
    });
  }, [prefersReduced]);

  const handleAutoLayout = useCallback(() => {
    if (flowNodes.length === 0 || !reqGraph) return;

    setLayoutOverrides(
      autoLayoutGraph(flowNodes, reqGraph.edges, {
        originX: 40,
        originY: 260,
        columnGap: 290,
        rowGap: 170,
      }),
    );
    window.requestAnimationFrame(() => {
      flowInstanceRef.current?.fitView({
        padding: 0.24,
        duration: prefersReduced ? 0 : 280,
      });
    });
  }, [flowNodes, prefersReduced, reqGraph]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!problemDetail || !isReadyToSubmit) return;

    setSubmitError('');
    setSlotFeedback({});
    try {
      const response = await submit.mutateAsync({
        problemId: problemDetail.problem.id,
        requirementOrder: currentOrder,
        slotAnswers: answers,
        timeTakenMs: Math.max(Date.now() - startedAt, 1),
      });
      setResult(response);
      const feedback: Record<string, boolean> = {};
      for (const sr of response.slotResults) feedback[sr.slotId] = sr.correct;
      setSlotFeedback(feedback);
      if (response.passed) {
        setCompletedOrders((prev) => new Set(prev).add(currentOrder));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['problems', slug] }), // refresh completedRequirementOrders + isSolved
        queryClient.invalidateQueries({
          queryKey: ['problems', token || null],
        }), // refresh problems list isSolved badge
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
      ]);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Could not submit your answer.',
      );
    }
  }, [
    answers,
    currentOrder,
    isAuthenticated,
    isReadyToSubmit,
    problemDetail,
    queryClient,
    router,
    startedAt,
    submit,
  ]);

  const handleNextRequirement = useCallback(() => {
    if (!reqGraph) return;
    setCurrentOrder(currentOrder + 1);
    setResult(null);
  }, [currentOrder, reqGraph]);

  // Dismiss result overlay but keep current slot placements and feedback visible
  const handleDismissResult = useCallback(() => {
    setResult(null);
  }, []);

  // Reset everything and start the requirement from scratch
  const handleReset = useCallback(() => {
    setResult(null);
    setAnswers({});
    setSlotFeedback({});
    setSelectedSlotId('');
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, []);

  const handleShareChallenge = useCallback(async () => {
    try {
      const response = await shareProblem.mutateAsync(slug);
      await navigator.clipboard.writeText(response.url);
      toastCtx?.toast('Challenge link copied!', 'success');
    } catch {
      // fallback: copy current URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toastCtx?.toast('Link copied!', 'success');
      } catch {
        toastCtx?.toast('Could not copy link', 'error');
      }
    }
  }, [shareProblem, slug, toastCtx]);

  const handleFullRetry = useCallback(() => {
    hasRestoredRef.current = false;
    setResult(null);
    setCurrentOrder(1);
    setCompletedOrders(new Set());
    setAnswers({});
    setSlotFeedback({});
    setSelectedSlotId('');
    setLayoutOverrides({});
    setSubmitError('');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, []);

  const handleSelectRequirement = useCallback(
    (order: number) => {
      const highestAccessible =
        completedOrders.size > 0 ? Math.max(...completedOrders) + 1 : 1;
      if (completedOrders.has(order) || order === highestAccessible) {
        setCurrentOrder(order);
        setResult(null);
      }
    },
    [completedOrders],
  );

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
  // Full overlay only for the very last requirement (pass or fail); inline compact for everything else
  const showFullResult = result !== null && isLastRequirement;
  const showCompactResult = result !== null && !isLastRequirement;

  // ── Leave modal ──────────────────────────────────────────────────────────
  const [leaveModal, setLeaveModal] = useState<{ open: boolean; href: string }>(
    { open: false, href: '' },
  );
  const leaveHrefRef = useRef('');

  // Keep a ref in sync so event handlers always read the latest value without
  // needing to be re-registered. Avoids stale closure bugs entirely.
  const shouldWarnOnLeaveRef = useRef(false);
  shouldWarnOnLeaveRef.current =
    Object.keys(answers).length > 0 && !showFullResult;

  const handleNavigateAway = useCallback(
    (href: string) => {
      if (shouldWarnOnLeaveRef.current) {
        leaveHrefRef.current = href;
        setLeaveModal({ open: true, href });
      } else {
        router.push(href);
      }
    },
    [router],
  );

  const handleLeaveConfirm = useCallback(() => {
    const href = leaveHrefRef.current;
    setLeaveModal({ open: false, href: '' });
    router.push(href);
  }, [router]);

  const handleLeaveCancel = useCallback(() => {
    setLeaveModal({ open: false, href: '' });
  }, []);

  // Block browser refresh / tab close — registered once, reads from ref
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldWarnOnLeaveRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Block browser back button — registered once, reads from ref
  useEffect(() => {
    const handlePopState = () => {
      if (!shouldWarnOnLeaveRef.current) return;
      // Push a dummy entry so the URL stays on this page while the modal is shown
      window.history.pushState(null, '', window.location.href);
      leaveHrefRef.current = '/problems';
      setLeaveModal({ open: true, href: '/problems' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isLoading = isProblemLoading || isGraphLoading;
  const isError =
    isProblemError || (!isGraphLoading && !!problemDetail && !reqGraph);

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
        onNavigate={handleNavigateAway}
        onShare={handleShareChallenge}
        isSharing={shareProblem.isPending}
      />

      <MobileReadOnlyNotice title={problemDetail?.problem.title} />

      <div className="hidden min-h-0 flex-1 md:flex md:flex-col">
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
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Problem unavailable
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              The API could not load this system design problem.
            </p>
            <Link
              href="/problems"
              className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-primary)]"
            >
              Back to problems
            </Link>
          </main>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
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
                  onComponentClick={handleComponentClick}
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
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full bg-[var(--text-primary)]/25 transition-colors group-hover:bg-[var(--accent-primary)]/60"
                    />
                  ))}
                </div>
              </div>

              {/* Right: canvas */}
              <section className="relative flex-1 bg-[var(--bg-game-canvas)]">
                <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-sm rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)]/92 px-3 py-2.5 shadow-lg backdrop-blur">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                    <LocateFixed className="h-3 w-3" aria-hidden="true" />
                    Requirement {currentOrder}
                  </div>
                  <div className="text-sm font-semibold leading-tight text-[var(--text-primary)]">
                    {currentRequirement?.title ?? problemDetail.problem.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {slotIds.length === 0
                      ? 'Explore the revealed architecture path.'
                      : selectedSlotId
                        ? `Slot selected. ${remainingSlots} open ${remainingSlots === 1 ? 'slot' : 'slots'} left.`
                        : `${remainingSlots} open ${remainingSlots === 1 ? 'slot' : 'slots'} left.`}
                  </div>
                </div>

                <CanvasToolbar
                  hasNodes={flowNodes.length > 0}
                  minimapVisible={isMinimapVisible}
                  snapToGrid={snapToGrid}
                  simulationEnabled={simulationEnabled}
                  onAutoLayout={handleAutoLayout}
                  onFitView={handleFitView}
                  onToggleMinimap={() =>
                    setIsMinimapVisible((current) => !current)
                  }
                  onToggleSnap={() => setSnapToGrid((current) => !current)}
                  onToggleSimulation={() =>
                    setSimulationEnabled((current) => !current)
                  }
                />

                <ReactFlowProvider>
                  <div className="absolute inset-0">
                    <ReactFlow
                      nodes={flowNodes}
                      edges={flowEdges}
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      nodesDraggable={false}
                      snapToGrid={snapToGrid}
                      snapGrid={[24, 24]}
                      onInit={(instance) => {
                        flowInstanceRef.current = instance;
                      }}
                      fitView
                      fitViewOptions={{ padding: 0.2 }}
                      minZoom={0.5}
                      maxZoom={1.5}
                      proOptions={{ hideAttribution: true }}
                    >
                      <Background
                        variant={BackgroundVariant.Dots}
                        color="var(--text-secondary)"
                        gap={24}
                        size={1}
                      />
                      {showMinimap && (
                        <MiniMap
                          pannable
                          zoomable
                          nodeColor={(node) => {
                            if (node.type === 'blankSlot')
                              return 'var(--slot-blank)';
                            if (node.type === 'filledSlot')
                              return 'var(--slot-correct)';
                            return 'var(--accent-primary)';
                          }}
                          maskColor="rgba(0,0,0,0.08)"
                        />
                      )}
                    </ReactFlow>
                  </div>
                </ReactFlowProvider>

                {flowNodes.length === 0 && (
                  <div className="absolute inset-0 z-10 grid place-items-center p-8 text-center">
                    <div className="rounded-lg border border-dashed border-[var(--text-primary)]/15 bg-[var(--bg-primary)]/80 px-5 py-4 text-sm text-[var(--text-secondary)] shadow-sm">
                      Canvas is ready.
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {activeSlug ? (
                    <motion.div
                      key="drop-state"
                      initial={
                        prefersReduced ? undefined : { opacity: 0, y: 8 }
                      }
                      animate={
                        prefersReduced ? undefined : { opacity: 1, y: 0 }
                      }
                      exit={prefersReduced ? undefined : { opacity: 0, y: 8 }}
                      className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[var(--slot-blank)]/30 bg-[var(--bg-primary)]/95 px-4 py-2 text-xs font-semibold text-[var(--slot-blank)] shadow-lg backdrop-blur"
                    >
                      Drop on an open slot
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Compact result overlay (mid-requirement pass or fail) */}
                <AnimatePresence>
                  {showCompactResult && currentRequirement ? (
                    <CompactResult
                      key={`compact-${currentOrder}`}
                      result={result}
                      onNext={handleNextRequirement}
                      onDismiss={handleDismissResult}
                      onReset={handleReset}
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
      </div>

      {/* Full result overlay (last requirement only) */}
      <AnimatePresence>
        {showFullResult && problemDetail ? (
          <ResultOverlay
            key={`result-${currentOrder}`}
            result={result}
            componentTypes={problemDetail.componentTypes}
            onRetry={result?.passed ? handleFullRetry : handleReset}
            onDismiss={result?.passed ? undefined : handleDismissResult}
            nextProblemSlug={result?.passed ? nextProblemSlug : undefined}
            onShare={handleShareChallenge}
            isSharing={shareProblem.isPending}
          />
        ) : null}
      </AnimatePresence>

      <LeaveConfirmModal
        open={leaveModal.open}
        onConfirm={handleLeaveConfirm}
        onCancel={handleLeaveCancel}
      />
    </div>
  );
}
