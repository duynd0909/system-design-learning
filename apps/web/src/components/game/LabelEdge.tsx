'use client';

import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import {
  EDGE_KIND_STYLES,
  edgeStatusStroke,
  type SystemEdgeKind,
  type SystemEdgeStatus,
} from './graph-config';

export interface SystemEdgeData extends Record<string, unknown> {
  kind?: SystemEdgeKind;
  status?: SystemEdgeStatus;
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onHover?: (edgeId: string) => void;
  onHoverEnd?: () => void;
}

export function LabelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  data,
  animated,
}: EdgeProps) {
  const prefersReduced = useReducedMotion();
  const edgeData = data as SystemEdgeData | undefined;
  const kind = edgeData?.kind ?? 'request';
  const isActive = edgeData?.isActive ?? false;
  const isHighlighted = edgeData?.isHighlighted ?? false;
  const isDimmed = edgeData?.isDimmed ?? false;
  const status: SystemEdgeStatus = isActive ? 'active' : edgeData?.status ?? 'normal';
  const kindStyle = EDGE_KIND_STYLES[kind];
  const stroke = edgeStatusStroke(kind, status);
  const shouldAnimate = !prefersReduced && (animated || isActive || kind === 'streaming');
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: kind === 'cache' ? 0.42 : 0.24,
  });
  const edgeStyle: CSSProperties = {
    ...style,
    stroke,
    strokeWidth: isActive || isHighlighted ? 3 : 2,
    strokeDasharray: kindStyle.dasharray,
    strokeDashoffset: shouldAnimate ? 0 : undefined,
    opacity: isDimmed ? 0.25 : 1,
    filter: isActive ? `drop-shadow(0 0 6px ${stroke})` : undefined,
    animation: shouldAnimate ? 'system-edge-dash 1s linear infinite' : undefined,
    transition: 'stroke 160ms ease, opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease',
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        className="cursor-pointer"
        onMouseEnter={() => edgeData?.onHover?.(id)}
        onMouseLeave={() => edgeData?.onHoverEnd?.()}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded-full border bg-[var(--bg-primary)] px-2.5 py-1 text-[10px] font-semibold shadow-sm transition-all duration-150"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              borderColor: isActive || isHighlighted ? stroke : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
              color: stroke,
              opacity: isDimmed ? 0.35 : 1,
            }}
            onMouseEnter={() => edgeData?.onHover?.(id)}
            onMouseLeave={() => edgeData?.onHoverEnd?.()}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
