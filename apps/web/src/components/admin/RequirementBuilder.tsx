'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
  type NodePositionChange,
  type EdgeRemoveChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Eye, EyeOff, X, Target } from 'lucide-react';
import type {
  ComponentType,
  GraphEdge,
  GraphNode,
} from '@stackdify/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  categoryForComponent,
  getCategoryStyle,
  normalizeComponentCategory,
} from '@/components/game/graph-config';
import { iconForComponent, ActorIcon } from '@/components/game/component-icons';
import { GraphNodeShell, NodeHandles } from '@/components/game/GameNodes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequirementData {
  order: number;
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  answer: Record<string, string>;
}

// ─── Builder Node components ──────────────────────────────────────────────────
// Reuse the exact same GraphNodeShell + NodeHandles as the game page so the
// node appearance, handle positions, and edge routing are identical.

interface BuilderComponentData extends Record<string, unknown> {
  componentSlug: string;
  label: string;
  category?: string;
  isAnswer: boolean;
  isPrevious: boolean;
  onToggleAnswer?: (nodeId: string, slug: string) => void;
  onDelete?: (nodeId: string) => void;
}

function BuilderComponentNode({
  id,
  data,
  selected,
}: NodeProps<Node<BuilderComponentData, 'component'>>) {
  const Icon = iconForComponent(data.componentSlug);
  const category = normalizeComponentCategory(
    data.category,
    data.componentSlug,
  );
  const categoryStyle = getCategoryStyle(category);

  return (
    <GraphNodeShell
      ariaLabel={`${data.label} component`}
      category={category}
      selected={!data.isPrevious && !!selected}
      dimmed={data.isPrevious}
      visualState={data.isAnswer ? 'missing-config' : 'idle'}
    >
      <NodeHandles />

      {/* ANSWER badge — floats above the node */}
      {data.isAnswer && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--slot-blank)] px-2 py-0.5 text-[9px] font-bold leading-none text-white shadow">
          ANSWER
        </div>
      )}

      {/* Builder action buttons (answer toggle + delete) */}
      {!data.isPrevious && (
        <div className="absolute -right-1 -top-2.5 flex items-center gap-0.5">
          <button
            type="button"
            title={data.isAnswer ? 'Unmark answer slot' : 'Mark as answer slot'}
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleAnswer?.(id, data.componentSlug);
            }}
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full border transition-colors',
              data.isAnswer
                ? 'border-[var(--slot-blank)] bg-[var(--slot-blank)] text-white'
                : 'border-[var(--text-primary)]/25 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--slot-blank)]/60 hover:text-[var(--slot-blank)]',
            )}
          >
            <Target className="h-2 w-2" />
          </button>
          <button
            type="button"
            title="Delete node"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--text-primary)]/25 bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:border-[var(--slot-incorrect)]/60 hover:text-[var(--slot-incorrect)]"
          >
            <X className="h-2 w-2" />
          </button>
        </div>
      )}

      {/* Same inner layout as ComponentNode */}
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
    </GraphNodeShell>
  );
}

interface BuilderActorData extends Record<string, unknown> {
  label: string;
  isPrevious: boolean;
  onDelete?: (nodeId: string) => void;
}

function BuilderActorNode({
  id,
  data,
  selected,
}: NodeProps<Node<BuilderActorData, 'actor'>>) {
  return (
    <GraphNodeShell
      ariaLabel={`${data.label} actor`}
      category="networking"
      selected={!data.isPrevious && !!selected}
      dimmed={data.isPrevious}
      className="min-w-32 rounded-full bg-[var(--bg-primary)]"
    >
      <NodeHandles />

      {!data.isPrevious && (
        <button
          type="button"
          title="Delete actor"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.(id);
          }}
          className="absolute -right-1 -top-2.5 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--text-primary)]/25 bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:border-[var(--slot-incorrect)]/60 hover:text-[var(--slot-incorrect)]"
        >
          <X className="h-2 w-2" />
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          <ActorIcon />
        </span>
        <span className="text-sm font-semibold">{data.label}</span>
      </div>
    </GraphNodeShell>
  );
}

// ─── Single requirement canvas ────────────────────────────────────────────────

interface SingleCanvasProps {
  requirement: RequirementData;
  allPreviousNodes: GraphNode[];
  componentTypes: ComponentType[];
  onChange: (req: RequirementData) => void;
  fullHeight?: boolean;
}

function SingleRequirementCanvas({
  requirement,
  allPreviousNodes,
  componentTypes,
  onChange,
  fullHeight,
}: SingleCanvasProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [actorName, setActorName] = useState('');
  const [showActorInput, setShowActorInput] = useState(false);

  const buildFlowNodes = useCallback(
    (
      req: RequirementData,
      prevNodes: GraphNode[],
      isPreview: boolean,
    ): Node[] => {
      const prevIds = new Set(prevNodes.map((n) => n.id));
      const prevFlowNodes: Node[] = prevNodes.map((n) => ({
        id: n.id,
        type: n.type === 'actor' ? 'actor' : 'component',
        position: n.position,
        draggable: false,
        data:
          n.type === 'actor'
            ? { label: (n.data as { label: string }).label, isPrevious: true }
            : {
                componentSlug: (n.data as { componentSlug: string })
                  .componentSlug,
                label: (n.data as { label: string }).label,
                isAnswer: false,
                isPrevious: true,
              },
      }));

      const currFlowNodes: Node[] = req.nodes
        .filter((n) => !prevIds.has(n.id))
        .map((n) => {
          if (n.type === 'actor') {
            return {
              id: n.id,
              type: 'actor',
              position: n.position,
              draggable: !isPreview,
              data: {
                label: (n.data as { label: string }).label,
                isPrevious: false,
              },
            };
          }
          const slug = (n.data as { componentSlug: string }).componentSlug;
          const isAnswer = n.id in req.answer;
          return {
            id: n.id,
            type: 'component',
            position: n.position,
            draggable: !isPreview,
            data: {
              componentSlug: slug,
              label: (n.data as { label: string }).label,
              isAnswer,
              isPrevious: false,
            },
          };
        });

      return [...prevFlowNodes, ...currFlowNodes];
    },
    [],
  );

  const buildFlowEdges = useCallback(
    (req: RequirementData): Edge[] =>
      req.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated ?? false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--text-secondary)',
        },
        style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
      })),
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildFlowNodes(requirement, allPreviousNodes, previewMode),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildFlowEdges(requirement),
  );

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      component: BuilderComponentNode as NodeTypes[string],
      actor: BuilderActorNode as NodeTypes[string],
    }),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--text-secondary)',
            },
            style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
          },
          eds,
        );
        const updatedEdges: GraphEdge[] = newEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === 'string' ? e.label : undefined,
          animated: e.animated,
        }));
        onChange({ ...requirement, edges: updatedEdges });
        return newEdges;
      });
    },
    [setEdges, requirement, onChange],
  );

  const prevNodeIds = useMemo(
    () => new Set(allPreviousNodes.map((n) => n.id)),
    [allPreviousNodes],
  );

  const handleToggleAnswer = useCallback(
    (nodeId: string, slug: string) => {
      const newAnswer = { ...requirement.answer };
      if (nodeId in newAnswer) {
        delete newAnswer[nodeId];
      } else {
        newAnswer[nodeId] = slug;
      }
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...(n.data as BuilderComponentData),
                  isAnswer: nodeId in newAnswer,
                },
              }
            : n,
        ),
      );
      onChange({ ...requirement, answer: newAnswer });
    },
    [requirement, onChange, setNodes],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const newAnswer = { ...requirement.answer };
      delete newAnswer[nodeId];
      const newNodes = requirement.nodes.filter((n) => n.id !== nodeId);
      const newEdges = requirement.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      );
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      onChange({
        ...requirement,
        nodes: newNodes,
        edges: newEdges,
        answer: newAnswer,
      });
    },
    [requirement, onChange, setNodes, setEdges],
  );

  // Inject callbacks into node data
  const nodesWithCb = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type === 'component') {
          return {
            ...n,
            data: {
              ...(n.data as BuilderComponentData),
              onToggleAnswer: handleToggleAnswer,
              onDelete: handleDeleteNode,
            },
          };
        }
        if (n.type === 'actor') {
          return {
            ...n,
            data: {
              ...(n.data as BuilderActorData),
              onDelete: handleDeleteNode,
            },
          };
        }
        return n;
      }),
    [nodes, handleToggleAnswer, handleDeleteNode],
  );

  const onNodesChangeWithPersist = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // Persist position changes back to requirement
      const positionChanges = changes.filter(
        (c): c is NodePositionChange => c.type === 'position' && !!c.position,
      );
      if (positionChanges.length > 0) {
        const updatedNodes = requirement.nodes.map((n) => {
          const change = positionChanges.find((c) => c.id === n.id);
          if (change && change.type === 'position' && change.position) {
            return { ...n, position: change.position };
          }
          return n;
        });
        onChange({ ...requirement, nodes: updatedNodes });
      }
    },
    [onNodesChange, requirement, onChange],
  );

  const addComponentNode = useCallback(
    (ct: ComponentType) => {
      const id = `${ct.slug}-${Date.now()}`;
      const position = {
        x: 300 + Math.random() * 200,
        y: 150 + Math.random() * 150,
      };
      const newNode: GraphNode = {
        id,
        type: 'component',
        position,
        data: { componentSlug: ct.slug, label: ct.label },
      };
      const flowNode: Node = {
        id,
        type: 'component',
        position,
        draggable: true,
        data: {
          componentSlug: ct.slug,
          label: ct.label,
          isAnswer: false,
          isPrevious: false,
          onToggleAnswer: handleToggleAnswer,
          onDelete: handleDeleteNode,
        },
      };
      setNodes((nds) => [...nds, flowNode]);
      onChange({ ...requirement, nodes: [...requirement.nodes, newNode] });
    },
    [requirement, onChange, setNodes, handleToggleAnswer, handleDeleteNode],
  );

  const addActorNode = useCallback(
    (label: string) => {
      if (!label.trim()) return;
      const id = `actor-${Date.now()}`;
      const position = { x: 50, y: 100 + Math.random() * 100 };
      const newNode: GraphNode = {
        id,
        type: 'actor',
        position,
        data: { label: label.trim() },
      };
      const flowNode: Node = {
        id,
        type: 'actor',
        position,
        draggable: true,
        data: {
          label: label.trim(),
          isPrevious: false,
          onDelete: handleDeleteNode,
        },
      };
      setNodes((nds) => [...nds, flowNode]);
      onChange({ ...requirement, nodes: [...requirement.nodes, newNode] });
      setActorName('');
      setShowActorInput(false);
    },
    [requirement, onChange, setNodes, handleDeleteNode],
  );

  const onEdgesChangeWithPersist = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      const removeChanges = changes.filter(
        (c): c is EdgeRemoveChange => c.type === 'remove',
      );
      if (removeChanges.length > 0) {
        const removedIds = new Set(removeChanges.map((c) => c.id));
        const newEdges = requirement.edges.filter((e) => !removedIds.has(e.id));
        onChange({ ...requirement, edges: newEdges });
      }
    },
    [onEdgesChange, requirement, onChange],
  );

  const currentNodeCount = requirement.nodes.filter(
    (n) => !prevNodeIds.has(n.id),
  ).length;
  const answerCount = Object.keys(requirement.answer).length;

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--bg-game-canvas)] overflow-hidden',
        fullHeight
          ? 'h-full'
          : 'h-[480px] rounded-xl border border-[var(--text-primary)]/12',
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-3 py-2">
        <span className="text-xs text-[var(--text-secondary)]">
          {currentNodeCount} node{currentNodeCount !== 1 ? 's' : ''} ·{' '}
          {answerCount} answer slot{answerCount !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreviewMode((p) => !p)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
            previewMode
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          {previewMode ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {previewMode ? 'Exit preview' : 'Preview'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Component palette */}
        {!previewMode && (
          <div className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Add node
            </p>
            {componentTypes.map((ct) => {
              const cat = categoryForComponent(ct);
              const style = getCategoryStyle(cat);
              return (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => addComponentNode(ct)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[var(--text-primary)]/8 transition-colors"
                  title={ct.description}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: style.accent }}
                  />
                  <span className="truncate text-[var(--text-primary)]">
                    {ct.label}
                  </span>
                </button>
              );
            })}

            <div className="mt-2 border-t border-[var(--text-primary)]/10 pt-2">
              {showActorInput ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Actor name…"
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addActorNode(actorName);
                      if (e.key === 'Escape') {
                        setShowActorInput(false);
                        setActorName('');
                      }
                    }}
                    className="w-full rounded border border-[var(--text-primary)]/20 bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-full text-[10px] py-1"
                    onClick={() => addActorNode(actorName)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowActorInput(true)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 transition-colors"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add Actor
                </button>
              )}
            </div>
          </div>
        )}

        {/* Flow canvas */}
        <div className="relative flex-1 h-full">
          <ReactFlow
            nodes={nodesWithCb}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChangeWithPersist}
            onEdgesChange={onEdgesChangeWithPersist}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            nodesDraggable={!previewMode}
            nodesConnectable={!previewMode}
            elementsSelectable={!previewMode}
            deleteKeyCode="Delete"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="var(--text-secondary)"
              gap={24}
              size={1}
            />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// ─── Requirement Builder (outer) ──────────────────────────────────────────────

interface RequirementBuilderProps {
  initialRequirements?: RequirementData[];
  componentTypes: ComponentType[];
  onChange: (requirements: RequirementData[]) => void;
  fullHeight?: boolean;
}

export function RequirementBuilder({
  initialRequirements = [],
  componentTypes,
  onChange,
  fullHeight,
}: RequirementBuilderProps) {
  const [requirements, setRequirements] = useState<RequirementData[]>(
    initialRequirements.length > 0
      ? initialRequirements
      : [
          {
            order: 1,
            title: '',
            description: '',
            nodes: [],
            edges: [],
            answer: {},
          },
        ],
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const updateRequirements = useCallback(
    (updated: RequirementData[]) => {
      setRequirements(updated);
      onChange(updated);
    },
    [onChange],
  );

  const updateReq = useCallback(
    (idx: number, req: RequirementData) => {
      const next = requirements.map((r, i) => (i === idx ? req : r));
      updateRequirements(next);
    },
    [requirements, updateRequirements],
  );

  const addRequirement = useCallback(() => {
    const newReq: RequirementData = {
      order: requirements.length + 1,
      title: '',
      description: '',
      nodes: [],
      edges: [],
      answer: {},
    };
    const next = [...requirements, newReq];
    updateRequirements(next);
    setActiveIdx(next.length - 1);
  }, [requirements, updateRequirements]);

  const deleteRequirement = useCallback(
    (idx: number) => {
      if (requirements.length <= 1) return;
      const next = requirements
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, order: i + 1 }));
      updateRequirements(next);
      setActiveIdx(Math.min(idx, next.length - 1));
    },
    [requirements, updateRequirements],
  );

  const allPreviousNodes = useMemo(
    () => requirements.slice(0, activeIdx).flatMap((r) => r.nodes),
    [requirements, activeIdx],
  );

  const activeReq = requirements[activeIdx];

  if (fullHeight) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Sidebar + canvas */}
        <div className="flex flex-1 min-h-0">
          {/* Left sidebar: req list + metadata */}
          <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] overflow-y-auto">
            <div className="border-b border-[var(--text-primary)]/10 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                Requirements
              </p>
              <div className="space-y-1">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className={cn(
                        'flex-1 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors',
                        activeIdx === i
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)]',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                            activeIdx === i
                              ? 'bg-white/20'
                              : 'bg-[var(--text-primary)]/10',
                          )}
                        >
                          {req.order}
                        </span>
                        {req.title || `Requirement ${req.order}`}
                      </span>
                    </button>
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteRequirement(i)}
                        className="rounded p-0.5 text-[var(--text-secondary)] hover:text-[var(--slot-incorrect)] transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Requirement
                </button>
              </div>
            </div>

            {activeReq && (
              <div className="space-y-3 p-3">
                <Input
                  label="Title"
                  placeholder="e.g. Route user traffic"
                  value={activeReq.title}
                  onChange={(e) =>
                    updateReq(activeIdx, {
                      ...activeReq,
                      title: e.target.value,
                    })
                  }
                />
                <Input
                  label="Description"
                  placeholder="What challenge does the player face?"
                  value={activeReq.description}
                  onChange={(e) =>
                    updateReq(activeIdx, {
                      ...activeReq,
                      description: e.target.value,
                    })
                  }
                />
                <div className="rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)]/60 p-2.5 text-xs text-[var(--text-secondary)]">
                  <p className="font-medium text-[var(--text-primary)]">
                    How to build
                  </p>
                  <ol className="mt-1.5 space-y-1 list-decimal list-inside">
                    <li>Click a component in the palette to add it</li>
                    <li>Drag nodes to position them</li>
                    <li>Connect nodes by dragging between handles</li>
                    <li>
                      Click{' '}
                      <span className="text-[var(--slot-blank)] font-semibold">
                        ⊙
                      </span>{' '}
                      to mark answer slots
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </aside>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            {activeReq && (
              <SingleRequirementCanvas
                key={activeIdx}
                requirement={activeReq}
                allPreviousNodes={allPreviousNodes}
                componentTypes={componentTypes}
                onChange={(req) => updateReq(activeIdx, req)}
                fullHeight
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Requirement tabs */}
      <div className="flex flex-wrap items-center gap-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                activeIdx === i
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              Req {req.order}
            </button>
            {requirements.length > 1 && (
              <button
                type="button"
                onClick={() => deleteRequirement(i)}
                className="ml-0.5 rounded p-0.5 text-[var(--text-secondary)] hover:text-[var(--slot-incorrect)] transition-colors"
                title="Remove requirement"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addRequirement}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Req
        </button>
      </div>

      {/* Req metadata */}
      {activeReq && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Requirement title"
            placeholder="e.g. Route user traffic"
            value={activeReq.title}
            onChange={(e) =>
              updateReq(activeIdx, { ...activeReq, title: e.target.value })
            }
          />
          <Input
            label="Description"
            placeholder="What challenge does the player face?"
            value={activeReq.description}
            onChange={(e) =>
              updateReq(activeIdx, {
                ...activeReq,
                description: e.target.value,
              })
            }
          />
        </div>
      )}

      {/* Canvas */}
      {activeReq && (
        <SingleRequirementCanvas
          key={activeIdx}
          requirement={activeReq}
          allPreviousNodes={allPreviousNodes}
          componentTypes={componentTypes}
          onChange={(req) => updateReq(activeIdx, req)}
        />
      )}
    </div>
  );
}
