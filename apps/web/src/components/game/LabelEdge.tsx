'use client';

import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
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
  isGlowMode?: boolean;
  parallelIndex?: number;
  parallelTotal?: number;
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const edgeData = data as SystemEdgeData | undefined;
  const kind = edgeData?.kind ?? 'request';
  const isActive = edgeData?.isActive ?? false;
  const isHighlighted = edgeData?.isHighlighted ?? false;
  const isDimmed = edgeData?.isDimmed ?? false;
  const isGlowMode = edgeData?.isGlowMode ?? false;
  const parallelIndex = edgeData?.parallelIndex ?? 0;
  const parallelTotal = edgeData?.parallelTotal ?? 1;
  const status: SystemEdgeStatus = isActive ? 'active' : edgeData?.status ?? 'normal';
  const kindStyle = EDGE_KIND_STYLES[kind];
  const stroke = edgeStatusStroke(kind, status);
  const labelStroke = edgeStatusStroke(kind, status, isDark);
  const shouldAnimate = !prefersReduced && (animated || isActive || kind === 'streaming');

  // Separate parallel edges by applying a perpendicular offset
  const offsetStep = 24;
  const myOffset = parallelTotal > 1
    ? -((parallelTotal - 1) * offsetStep) / 2 + parallelIndex * offsetStep
    : 0;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = (-dy / len) * myOffset;
  const perpY = (dx / len) * myOffset;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceX + perpX,
    sourceY: sourceY + perpY,
    sourcePosition,
    targetX: targetX + perpX,
    targetY: targetY + perpY,
    targetPosition,
    curvature: kind === 'cache' ? 0.42 : 0.24,
  });
  const edgeStyle: CSSProperties = {
    ...style,
    stroke,
    strokeWidth: isActive || isHighlighted ? 4 : 2.5,
    strokeDasharray: kindStyle.dasharray,
    strokeDashoffset: shouldAnimate ? 0 : undefined,
    opacity: isDimmed ? 0.25 : 1,
    filter: isActive || isGlowMode ? `drop-shadow(0 0 6px ${stroke})` : undefined,
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
              borderColor: isActive || isHighlighted ? labelStroke : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
              color: labelStroke,
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
