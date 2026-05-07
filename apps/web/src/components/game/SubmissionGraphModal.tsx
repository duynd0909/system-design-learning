'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react';
import type {
  ComponentType,
  ComponentNodeData,
  ActorNodeData,
  MaskedNode,
} from '@stackdify/shared-types';
import { useSubmissionById, useRequirementGraph } from '@/lib/api';
import {
  ActorNode,
  BlankSlotNode,
  ComponentNode,
  FilledSlotNode,
  type GameFlowNode,
} from '@/components/game/GameNodes';
import { LabelEdge, type SystemEdgeData } from '@/components/game/LabelEdge';
import { edgeStatusStroke, inferEdgeKind } from '@/components/game/graph-config';
import { scaleIn, spring } from '@/lib/animations';
import { Skeleton } from '@/components/ui/Skeleton';

const nodeTypes = {
  actor: ActorNode,
  blankSlot: BlankSlotNode,
  component: ComponentNode,
  filledSlot: FilledSlotNode,
} satisfies NodeTypes;

const edgeTypes = {
  label: LabelEdge,
} satisfies EdgeTypes;

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SubmissionGraphModalProps {
  submissionId: string | null;
  slug: string;
  token: string | null;
  componentTypes: ComponentType[];
  onClose: () => void;
}

export function SubmissionGraphModal({
  submissionId,
  slug,
  token,
  componentTypes,
  onClose,
}: SubmissionGraphModalProps) {
  const prefersReduced = useReducedMotion();

  const { data: submission, isLoading: isSubmissionLoading } = useSubmissionById(
    submissionId,
    token,
  );

  const requirementOrder = submission?.requirementOrder ?? 1;

  const { data: reqGraph, isLoading: isGraphLoading } = useRequirementGraph(
    slug,
    requirementOrder,
  );

  const componentBySlug = useMemo(
    () => new Map(componentTypes.map((c) => [c.slug, c])),
    [componentTypes],
  );

  const nodeSlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of reqGraph?.nodes ?? []) {
      if (node.type === 'blank') {
        const answerSlug = submission?.slotAnswers[node.id];
        if (answerSlug) map.set(node.id, answerSlug);
        continue;
      }
      if (isComponentData(node.data)) {
        map.set(node.id, node.data.componentSlug);
      }
    }
    return map;
  }, [submission?.slotAnswers, reqGraph?.nodes]);

  const flowNodes = useMemo<GameFlowNode[]>(() => {
    if (!reqGraph) return [];
    return reqGraph.nodes.map((node): GameFlowNode => {
      if (node.type === 'blank') {
        const placedSlug = submission?.slotAnswers[node.id];
        const component = placedSlug ? componentBySlug.get(placedSlug) : undefined;
        if (component) {
          return {
            id: node.id,
            type: 'filledSlot',
            position: node.position,
            data: {
              slotId: node.id,
              component,
              onClear: () => {},
              onSelectSlot: () => {},
              isSelected: false,
              isHighlighted: false,
              isDimmed: false,
              isSimulationActive: false,
              isGlowMode: false,
            },
          };
        }
        return {
          id: node.id,
          type: 'blankSlot',
          position: node.position,
          data: {
            slotId: node.id,
            hint: (node.data as { hint?: string }).hint,
            onSelectSlot: () => {},
            isSelected: false,
            isHighlighted: false,
            isDimmed: false,
            isGlowMode: false,
          },
        };
      }
      if (node.type === 'actor' && isActorData(node.data)) {
        return {
          id: node.id,
          type: 'actor',
          position: node.position,
          data: {
            label: node.data.label,
            isHighlighted: false,
            isDimmed: false,
            isSimulationActive: false,
            isGlowMode: false,
          },
        };
      }
      if (isComponentData(node.data)) {
        const component = componentBySlug.get(node.data.componentSlug);
        return {
          id: node.id,
          type: 'component',
          position: node.position,
          data: {
            componentSlug: node.data.componentSlug,
            category: component?.category,
            label: node.data.label,
            description: node.data.description ?? component?.description,
            isHighlighted: false,
            isDimmed: false,
            isSimulationActive: false,
            isGlowMode: false,
          },
        };
      }
      return {
        id: node.id,
        type: 'actor',
        position: node.position,
        data: { label: 'Actor', isHighlighted: false, isDimmed: false, isSimulationActive: false, isGlowMode: false },
      };
    });
  }, [componentBySlug, reqGraph, submission?.slotAnswers]);

  const flowEdges = useMemo<Edge<SystemEdgeData>[]>(() => {
    if (!reqGraph) return [];
    return reqGraph.edges.map((edge) => {
      const kind = inferEdgeKind(edge, {
        sourceSlug: nodeSlugById.get(edge.source),
        targetSlug: nodeSlugById.get(edge.target),
      });
      const color = edgeStatusStroke(kind, 'normal');
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        type: 'label',
        animated: edge.animated,
        markerEnd:
          edge.markerEnd || !edge.markerStart
            ? {
                type: MarkerType.ArrowClosed,
                color,
                width: edge.markerEnd?.width ?? 18,
                height: edge.markerEnd?.height ?? 18,
              }
            : undefined,
        markerStart: edge.markerStart
          ? {
              type: MarkerType.ArrowClosed,
              color,
              width: edge.markerStart.width ?? 18,
              height: edge.markerStart.height ?? 18,
            }
          : undefined,
        data: {
          kind,
          status: 'normal' as const,
          isActive: false,
          isHighlighted: false,
          isDimmed: false,
          isGlowMode: false,
          parallelIndex: 0,
          parallelTotal: 1,
          onHover: () => {},
          onHoverEnd: () => {},
        },
      };
    });
  }, [reqGraph, nodeSlugById]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!submissionId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [submissionId, handleClose]);

  if (!submissionId) return null;

  const isLoading = isSubmissionLoading || isGraphLoading;
  const timeTakenSecs = Math.round((submission?.timeTakenMs ?? 0) / 1000);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Submission graph view"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        initial={prefersReduced ? undefined : scaleIn.initial}
        animate={prefersReduced ? undefined : scaleIn.animate}
        transition={spring}
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] shadow-2xl"
        style={{ height: 'min(80vh, 640px)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--text-primary)]/10 px-4 py-3">
          {isLoading ? (
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ) : submission ? (
            <>
              <span className="rounded-md bg-[var(--text-primary)]/8 px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                Req {requirementOrder}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {formatDate(submission.createdAt)}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${submission.passed ? 'text-[var(--slot-correct)]' : 'text-[var(--slot-incorrect)]'}`}
              >
                {submission.score}%
              </span>
              {submission.passed ? (
                <CheckCircle2
                  className="h-4 w-4 text-[var(--slot-correct)]"
                  aria-label="Passed"
                />
              ) : (
                <XCircle
                  className="h-4 w-4 text-[var(--slot-incorrect)]"
                  aria-label="Failed"
                />
              )}
              <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatTime(timeTakenSecs)}
              </span>
            </>
          ) : null}
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close submission view"
            className="grid h-7 w-7 place-items-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Graph */}
        <div className="relative min-h-0 flex-1 bg-[var(--bg-game-canvas)]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-[var(--text-secondary)]">Loading graph…</div>
            </div>
          ) : (
            <ReactFlowProvider>
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesDraggable={false}
                nodesFocusable={false}
                edgesReconnectable={false}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.4}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  color="var(--text-secondary)"
                  gap={24}
                  size={1}
                />
              </ReactFlow>
            </ReactFlowProvider>
          )}
        </div>
      </motion.div>
    </div>
  );
}
