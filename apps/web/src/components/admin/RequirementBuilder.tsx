'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Eye, EyeOff, X, Target } from 'lucide-react';
import type { ComponentType, GraphEdge, GraphNode } from '@stackdify/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { categoryForComponent, getCategoryStyle, normalizeComponentCategory } from '@/components/game/graph-config';
import { iconForComponent } from '@/components/game/component-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequirementData {
  order: number;
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  answer: Record<string, string>;
}

// ─── Builder Node visual ──────────────────────────────────────────────────────

interface BuilderNodeData extends Record<string, unknown> {
  componentSlug: string;
  label: string;
  isAnswer: boolean;
  isPrevious: boolean;
  onToggleAnswer?: (nodeId: string, slug: string) => void;
  onDelete?: (nodeId: string) => void;
}

function BuilderComponentNode({ id, data, selected }: { id: string; data: BuilderNodeData; selected?: boolean }) {
  const cat = categoryForComponent({ slug: data.componentSlug, category: '' });
  const style = getCategoryStyle(cat);
  const Icon = iconForComponent(data.componentSlug);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 bg-[var(--bg-secondary)] px-3 py-2 min-w-[110px] text-center shadow-sm',
        data.isAnswer
          ? 'border-[var(--slot-blank)] bg-[var(--slot-blank)]/8'
          : data.isPrevious
          ? 'border-[var(--text-primary)]/20 opacity-60'
          : selected
          ? 'border-[var(--accent-primary)]'
          : 'border-[var(--text-primary)]/20',
      )}
      style={{ borderColor: data.isAnswer ? undefined : data.isPrevious ? undefined : style.border }}
    >
      {/* Answer badge */}
      {data.isAnswer && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--slot-blank)] px-1.5 py-0.5 text-[9px] font-bold text-white">
          ANSWER
        </div>
      )}

      <div className="flex flex-col items-center gap-1">
        <div className="h-6 w-6 text-[var(--text-primary)]">
          <Icon size={24} />
        </div>
        <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{data.label}</span>
      </div>

      {/* Action buttons — only for editable (non-previous) nodes */}
      {!data.isPrevious && (
        <div className="absolute -right-2 -top-2 flex gap-0.5">
          <button
            type="button"
            title={data.isAnswer ? 'Unmark answer' : 'Mark as answer slot'}
            onClick={() => data.onToggleAnswer?.(id, data.componentSlug)}
            className={cn(
              'rounded-full p-0.5 text-[10px] transition-colors',
              data.isAnswer
                ? 'bg-[var(--slot-blank)] text-white'
                : 'bg-[var(--bg-secondary)] border border-[var(--text-primary)]/20 text-[var(--text-secondary)] hover:bg-[var(--slot-blank)]/20',
            )}
          >
            <Target className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            title="Delete node"
            onClick={() => data.onDelete?.(id)}
            className="rounded-full border border-[var(--text-primary)]/20 bg-[var(--bg-secondary)] p-0.5 text-[var(--text-secondary)] hover:bg-[var(--slot-incorrect)]/20 hover:text-[var(--slot-incorrect)] transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* React Flow handles */}
      <div className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--text-primary)]/30 bg-[var(--bg-secondary)]" />
      <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--text-primary)]/30 bg-[var(--bg-secondary)]" />
    </div>
  );
}

interface ActorBuilderData extends Record<string, unknown> {
  label: string;
  isPrevious: boolean;
  onDelete?: (nodeId: string) => void;
}

function BuilderActorNode({ id, data }: { id: string; data: ActorBuilderData }) {
  return (
    <div className={cn('relative rounded-full border-2 border-dashed border-[var(--text-secondary)]/40 bg-[var(--bg-secondary)] px-4 py-2 text-center', data.isPrevious && 'opacity-60')}>
      <span className="text-xs font-semibold text-[var(--text-secondary)]">{data.label}</span>
      {!data.isPrevious && (
        <button
          type="button"
          title="Delete"
          onClick={() => data.onDelete?.(id)}
          className="absolute -right-2 -top-2 rounded-full border border-[var(--text-primary)]/20 bg-[var(--bg-secondary)] p-0.5 text-[var(--text-secondary)] hover:text-[var(--slot-incorrect)] transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
      <div className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--text-primary)]/30 bg-[var(--bg-secondary)]" />
      <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--text-primary)]/30 bg-[var(--bg-secondary)]" />
    </div>
  );
}

// ─── Single requirement canvas ────────────────────────────────────────────────

interface SingleCanvasProps {
  requirement: RequirementData;
  allPreviousNodes: GraphNode[];
  componentTypes: ComponentType[];
  onChange: (req: RequirementData) => void;
}

function SingleRequirementCanvas({ requirement, allPreviousNodes, componentTypes, onChange }: SingleCanvasProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [actorName, setActorName] = useState('');
  const [showActorInput, setShowActorInput] = useState(false);

  const buildFlowNodes = useCallback(
    (req: RequirementData, prevNodes: GraphNode[], isPreview: boolean): Node[] => {
      const prevIds = new Set(prevNodes.map((n) => n.id));
      const prevFlowNodes: Node[] = prevNodes.map((n) => ({
        id: n.id,
        type: n.type === 'actor' ? 'builderActor' : 'builderComponent',
        position: n.position,
        draggable: false,
        data: n.type === 'actor'
          ? { label: (n.data as { label: string }).label, isPrevious: true }
          : {
              componentSlug: (n.data as { componentSlug: string }).componentSlug,
              label: (n.data as { label: string }).label,
              isAnswer: false,
              isPrevious: true,
            },
      }));

      const currFlowNodes: Node[] = req.nodes.filter((n) => !prevIds.has(n.id)).map((n) => {
        if (n.type === 'actor') {
          return {
            id: n.id,
            type: 'builderActor',
            position: n.position,
            draggable: !isPreview,
            data: { label: (n.data as { label: string }).label, isPrevious: false },
          };
        }
        const slug = (n.data as { componentSlug: string }).componentSlug;
        const isAnswer = slug in req.answer || n.id in req.answer;
        return {
          id: n.id,
          type: 'builderComponent',
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

  const buildFlowEdges = useCallback((req: RequirementData): Edge[] =>
    req.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated,
      style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
    })), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildFlowNodes(requirement, allPreviousNodes, previewMode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildFlowEdges(requirement));

  const nodeTypes: NodeTypes = useMemo(() => ({
    builderComponent: (props) => (
      <BuilderComponentNode
        id={props.id}
        data={props.data as BuilderNodeData}
        selected={props.selected}
      />
    ),
    builderActor: (props) => (
      <BuilderActorNode id={props.id} data={props.data as ActorBuilderData} />
    ),
  }), []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge({ ...connection, style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 } }, eds);
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
  }, [setEdges, requirement, onChange]);

  const prevNodeIds = useMemo(() => new Set(allPreviousNodes.map((n) => n.id)), [allPreviousNodes]);

  const handleToggleAnswer = useCallback((nodeId: string, slug: string) => {
    const newAnswer = { ...requirement.answer };
    if (nodeId in newAnswer) {
      delete newAnswer[nodeId];
    } else {
      newAnswer[nodeId] = slug;
    }
    setNodes((nds) => nds.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...(n.data as BuilderNodeData), isAnswer: nodeId in newAnswer } }
        : n,
    ));
    onChange({ ...requirement, answer: newAnswer });
  }, [requirement, onChange, setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const newAnswer = { ...requirement.answer };
    delete newAnswer[nodeId];
    const newNodes = requirement.nodes.filter((n) => n.id !== nodeId);
    const newEdges = requirement.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    onChange({ ...requirement, nodes: newNodes, edges: newEdges, answer: newAnswer });
  }, [requirement, onChange, setNodes, setEdges]);

  // Inject callbacks into node data
  const nodesWithCb = useMemo(() => nodes.map((n) => {
    if (n.type === 'builderComponent') {
      return { ...n, data: { ...(n.data as BuilderNodeData), onToggleAnswer: handleToggleAnswer, onDelete: handleDeleteNode } };
    }
    if (n.type === 'builderActor') {
      return { ...n, data: { ...(n.data as ActorBuilderData), onDelete: handleDeleteNode } };
    }
    return n;
  }), [nodes, handleToggleAnswer, handleDeleteNode]);

  const onNodesChangeWithPersist = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
    // Persist position changes back to requirement
    const positionChanges = changes.filter((c) => c.type === 'position' && c.position);
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
  }, [onNodesChange, requirement, onChange]);

  const addComponentNode = useCallback((ct: ComponentType) => {
    const id = `${ct.slug}-${Date.now()}`;
    const position = { x: 300 + Math.random() * 200, y: 150 + Math.random() * 150 };
    const newNode: GraphNode = {
      id,
      type: 'component',
      position,
      data: { componentSlug: ct.slug, label: ct.label },
    };
    const flowNode: Node = {
      id,
      type: 'builderComponent',
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
  }, [requirement, onChange, setNodes, handleToggleAnswer, handleDeleteNode]);

  const addActorNode = useCallback((label: string) => {
    if (!label.trim()) return;
    const id = `actor-${Date.now()}`;
    const position = { x: 50, y: 100 + Math.random() * 100 };
    const newNode: GraphNode = { id, type: 'actor', position, data: { label: label.trim() } };
    const flowNode: Node = {
      id,
      type: 'builderActor',
      position,
      draggable: true,
      data: { label: label.trim(), isPrevious: false, onDelete: handleDeleteNode },
    };
    setNodes((nds) => [...nds, flowNode]);
    onChange({ ...requirement, nodes: [...requirement.nodes, newNode] });
    setActorName('');
    setShowActorInput(false);
  }, [requirement, onChange, setNodes, handleDeleteNode]);

  const onEdgesChangeWithPersist = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes);
    const removeChanges = changes.filter((c) => c.type === 'remove');
    if (removeChanges.length > 0) {
      const removedIds = new Set(removeChanges.map((c) => c.id));
      const newEdges = requirement.edges.filter((e) => !removedIds.has(e.id));
      onChange({ ...requirement, edges: newEdges });
    }
  }, [onEdgesChange, requirement, onChange]);

  const currentNodeCount = requirement.nodes.filter((n) => !prevNodeIds.has(n.id)).length;
  const answerCount = Object.keys(requirement.answer).length;

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-[var(--text-primary)]/12 bg-[var(--bg-primary)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-3 py-2">
        <span className="text-xs text-[var(--text-secondary)]">
          {currentNodeCount} node{currentNodeCount !== 1 ? 's' : ''} · {answerCount} answer slot{answerCount !== 1 ? 's' : ''}
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
          {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {previewMode ? 'Exit preview' : 'Preview'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Component palette */}
        {!previewMode && (
          <div className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Add node</p>
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
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: style.accent }} />
                  <span className="truncate text-[var(--text-primary)]">{ct.label}</span>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') addActorNode(actorName); if (e.key === 'Escape') { setShowActorInput(false); setActorName(''); } }}
                    className="w-full rounded border border-[var(--text-primary)]/20 bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    autoFocus
                  />
                  <Button type="button" variant="primary" size="sm" className="w-full text-[10px] py-1" onClick={() => addActorNode(actorName)}>
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
        <div className="flex-1">
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
            <Background />
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
}

export function RequirementBuilder({ initialRequirements = [], componentTypes, onChange }: RequirementBuilderProps) {
  const [requirements, setRequirements] = useState<RequirementData[]>(
    initialRequirements.length > 0
      ? initialRequirements
      : [{ order: 1, title: '', description: '', nodes: [], edges: [], answer: {} }],
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const updateRequirements = useCallback((updated: RequirementData[]) => {
    setRequirements(updated);
    onChange(updated);
  }, [onChange]);

  const updateReq = useCallback((idx: number, req: RequirementData) => {
    const next = requirements.map((r, i) => (i === idx ? req : r));
    updateRequirements(next);
  }, [requirements, updateRequirements]);

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

  const deleteRequirement = useCallback((idx: number) => {
    if (requirements.length <= 1) return;
    const next = requirements
      .filter((_, i) => i !== idx)
      .map((r, i) => ({ ...r, order: i + 1 }));
    updateRequirements(next);
    setActiveIdx(Math.min(idx, next.length - 1));
  }, [requirements, updateRequirements]);

  const allPreviousNodes = useMemo(
    () => requirements.slice(0, activeIdx).flatMap((r) => r.nodes),
    [requirements, activeIdx],
  );

  const activeReq = requirements[activeIdx];

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
            onChange={(e) => updateReq(activeIdx, { ...activeReq, title: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="What challenge does the player face?"
            value={activeReq.description}
            onChange={(e) => updateReq(activeIdx, { ...activeReq, description: e.target.value })}
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
