import type { ComponentType, GraphEdge } from '@stackdify/shared-types';

export type ComponentSemanticCategory = 'networking' | 'compute' | 'storage' | 'async' | 'security';
export type GraphNodeVisualState = 'idle' | 'hover' | 'selected' | 'valid' | 'warning' | 'error' | 'processing' | 'missing-config';
export type SystemEdgeKind = 'request' | 'streaming' | 'async' | 'cache';
export type SystemEdgeStatus = 'normal' | 'warning' | 'error' | 'active';

export interface ComponentCategoryStyle {
  label: string;
  accent: string;
  soft: string;
  border: string;
  glow: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
}

export interface PortLabels {
  input: string;
  output: string;
}

export interface EdgeStyleConfig {
  label: string;
  stroke: string;
  darkStroke: string;
  activeStroke: string;
  darkActiveStroke: string;
  dasharray?: string;
}

export const COMPONENT_CATEGORY_ORDER: ComponentSemanticCategory[] = [
  'networking',
  'compute',
  'storage',
  'async',
  'security',
];

export const COMPONENT_CATEGORY_STYLES: Record<ComponentSemanticCategory, ComponentCategoryStyle> = {
  networking: {
    label: 'Networking',
    accent: '#3b82f6',
    soft: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    glow: 'rgba(59, 130, 246, 0.22)',
    textClass: 'text-blue-600 dark:text-blue-300',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    ringClass: 'ring-blue-500/20',
  },
  compute: {
    label: 'Compute',
    accent: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.35)',
    glow: 'rgba(79, 70, 229, 0.22)',
    textClass: 'text-indigo-600 dark:text-indigo-300',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
    ringClass: 'ring-indigo-500/20',
  },
  storage: {
    label: 'Storage',
    accent: '#10b981',
    soft: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.22)',
    textClass: 'text-emerald-600 dark:text-emerald-300',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    ringClass: 'ring-emerald-500/20',
  },
  async: {
    label: 'Async',
    accent: '#f97316',
    soft: 'rgba(249, 115, 22, 0.13)',
    border: 'rgba(249, 115, 22, 0.4)',
    glow: 'rgba(249, 115, 22, 0.24)',
    textClass: 'text-orange-600 dark:text-orange-300',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/35',
    ringClass: 'ring-orange-500/20',
  },
  security: {
    label: 'Security',
    accent: '#ef4444',
    soft: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.22)',
    textClass: 'text-red-600 dark:text-red-300',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    ringClass: 'ring-red-500/20',
  },
};

const COMPONENT_CATEGORY_OVERRIDES: Record<string, ComponentSemanticCategory> = {
  // networking
  cdn: 'networking',
  dns: 'networking',
  'load-balancer': 'networking',
  'connection-gateway': 'networking',
  'rate-limiter': 'networking',
  switch: 'networking',
  'network-tower': 'networking',
  towers: 'networking',
  // compute
  server: 'compute',
  'auth-server': 'compute',
  'code-execution-server': 'compute',
  'external-server': 'compute',
  'media-server': 'compute',
  'chess-server': 'compute',
  'game-server': 'compute',
  'gaming-client': 'compute',
  client: 'compute',
  desktop: 'compute',
  // storage
  database: 'storage',
  'nosql-database': 'storage',
  cache: 'storage',
  'file-server': 'storage',
  'data-lake': 'storage',
  'graph-database': 'storage',
  'time-series-database': 'storage',
  'backup-storage': 'storage',
  'elastic-search': 'storage',
  // async
  'message-queue': 'async',
  'change-data-capture': 'async',
  'task-scheduler': 'async',
  'video-transporter': 'async',
  // compute — monitoring
  'metrics-engine': 'compute',
  'anomaly-detection-service': 'compute',
  'analytics-engine': 'compute',
  dashboard: 'compute',
  'health-checker': 'compute',
  // compute — services
  'notification-service': 'compute',
  'email-service': 'compute',
  'sms-service': 'compute',
  'payments-service': 'compute',
  'profile-service': 'compute',
  'chat-service': 'compute',
  'document-service': 'compute',
  'group-service': 'compute',
  'versioning-service': 'compute',
  'booking-service': 'compute',
  'news-feed': 'compute',
  'posts-service': 'compute',
  'discussion-service': 'compute',
  'locking-service': 'compute',
  'social-network-manager': 'compute',
  'inventory-service': 'compute',
  'order-service': 'compute',
  'products-service': 'compute',
  'trie-builder-service': 'compute',
  'matching-service': 'compute',
  'aggregator-service': 'compute',
  'ranking-service': 'compute',
  'recommendation-engine': 'compute',
  'prediction-engine': 'compute',
  'crawler-service': 'compute',
  'image-search-service': 'compute',
  'audio-processing-engine': 'compute',
  'conversational-model-service': 'compute',
  'image-generation-service': 'compute',
  'image-analysis-engine': 'compute',
  transformer: 'compute',
  'video-camera': 'compute',
  'map-service': 'compute',
  'graph-service': 'compute',
  // security
  'token-generation-service': 'security',
  'session-service': 'security',
  'fraud-detection-service': 'security',
  firewall: 'security',
  waf: 'security',
  'auth-service': 'security',
};

export const PORT_LABELS_BY_CATEGORY: Record<ComponentSemanticCategory, PortLabels> = {
  networking: { input: 'Inbound traffic', output: 'Routed traffic' },
  compute: { input: 'Request in', output: 'Response out' },
  storage: { input: 'Read/write', output: 'Result' },
  async: { input: 'Enqueue', output: 'Dequeue' },
  security: { input: 'Untrusted', output: 'Allowed' },
};

export const EDGE_KIND_STYLES: Record<SystemEdgeKind, EdgeStyleConfig> = {
  request: {
    label: 'Request',
    stroke: '#64748b',
    darkStroke: '#94a3b8',
    activeStroke: '#4f46e5',
    darkActiveStroke: '#818cf8',
  },
  streaming: {
    label: 'Stream',
    stroke: '#3b82f6',
    darkStroke: '#60a5fa',
    activeStroke: '#2563eb',
    darkActiveStroke: '#60a5fa',
    dasharray: '9 7',
  },
  async: {
    label: 'Queue',
    stroke: '#f97316',
    darkStroke: '#fb923c',
    activeStroke: '#ea580c',
    darkActiveStroke: '#fb923c',
    dasharray: '2 7',
  },
  cache: {
    label: 'Cache',
    stroke: '#10b981',
    darkStroke: '#34d399',
    activeStroke: '#059669',
    darkActiveStroke: '#34d399',
    dasharray: '7 5',
  },
};

const EDGE_STATUS_STROKES: Record<SystemEdgeStatus, string> = {
  normal: '#64748b',
  warning: '#f59e0b',
  error: '#ef4444',
  active: '#4f46e5',
};

const EDGE_STATUS_STROKES_DARK: Record<SystemEdgeStatus, string> = {
  normal: '#94a3b8',
  warning: '#fcd34d',
  error: '#f87171',
  active: '#818cf8',
};

export function normalizeComponentCategory(category?: string, slug?: string): ComponentSemanticCategory {
  if (slug && COMPONENT_CATEGORY_OVERRIDES[slug]) {
    return COMPONENT_CATEGORY_OVERRIDES[slug];
  }

  const normalized = category?.toLowerCase().trim() ?? '';

  if (normalized.includes('security') || normalized.includes('auth') || normalized.includes('firewall')) {
    return 'security';
  }
  if (normalized.includes('message') || normalized.includes('queue') || normalized.includes('event') || normalized.includes('async')) {
    return 'async';
  }
  if (normalized.includes('compute') || normalized.includes('server') || normalized.includes('media')) {
    return 'compute';
  }
  if (normalized.includes('storage') || normalized.includes('data') || normalized.includes('db') || normalized.includes('cache')) {
    return 'storage';
  }
  return 'networking';
}

export function categoryForComponent(component?: Pick<ComponentType, 'category' | 'slug'> | null): ComponentSemanticCategory {
  return normalizeComponentCategory(component?.category, component?.slug);
}

export function getCategoryStyle(category: ComponentSemanticCategory): ComponentCategoryStyle {
  return COMPONENT_CATEGORY_STYLES[category];
}

export function getPortLabels(category: ComponentSemanticCategory): PortLabels {
  return PORT_LABELS_BY_CATEGORY[category];
}

export function edgeStatusStroke(kind: SystemEdgeKind, status: SystemEdgeStatus, dark = false): string {
  if (status === 'normal') return dark ? EDGE_KIND_STYLES[kind].darkStroke : EDGE_KIND_STYLES[kind].stroke;
  if (status === 'active') return dark ? EDGE_KIND_STYLES[kind].darkActiveStroke : EDGE_KIND_STYLES[kind].activeStroke;
  return dark ? EDGE_STATUS_STROKES_DARK[status] : EDGE_STATUS_STROKES[status];
}

export function inferEdgeKind(
  edge: Pick<GraphEdge, 'label'>,
  context?: { sourceSlug?: string; targetSlug?: string },
): SystemEdgeKind {
  const label = edge.label?.toLowerCase() ?? '';
  const sourceSlug = context?.sourceSlug?.toLowerCase() ?? '';
  const targetSlug = context?.targetSlug?.toLowerCase() ?? '';

  if (
    label.includes('queue') ||
    label.includes('enqueue') ||
    label.includes('event') ||
    label.includes('job') ||
    label.includes('async') ||
    sourceSlug.includes('message-queue') ||
    targetSlug.includes('message-queue')
  ) {
    return 'async';
  }

  if (
    label.includes('stream') ||
    label.includes('webrtc') ||
    label.includes('media') ||
    label.includes('video') ||
    label.includes('audio') ||
    label.includes('transcode')
  ) {
    return 'streaming';
  }

  if (
    label.includes('cache') ||
    label.includes('origin pull') ||
    label.includes('static') ||
    label.includes('asset') ||
    label.includes('hot') ||
    ((sourceSlug === 'cache' || targetSlug === 'cache' || sourceSlug === 'cdn' || targetSlug === 'cdn') && label.includes('read'))
  ) {
    return 'cache';
  }

  return 'request';
}

// Extend this file when adding new component families or traffic semantics.
// The database/API can stay stable while the learning UI gains richer visual language.
