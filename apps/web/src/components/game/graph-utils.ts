export interface GraphPosition {
  x: number;
  y: number;
}

export interface GraphLayoutNode {
  id: string;
  position?: GraphPosition;
}

export interface GraphLayoutEdge {
  id?: string;
  source: string;
  target: string;
}

export interface ConnectedPath {
  edgeIds: Set<string>;
  nodeIds: Set<string>;
}

export interface AutoLayoutOptions {
  originX?: number;
  originY?: number;
  columnGap?: number;
  rowGap?: number;
}

export function emptyConnectedPath(): ConnectedPath {
  return { edgeIds: new Set(), nodeIds: new Set() };
}

export function getDirectEdgeNodes(edgeId: string, edges: GraphLayoutEdge[]): Set<string> {
  const edge = edges.find((item) => item.id === edgeId);
  if (!edge) return new Set();
  return new Set([edge.source, edge.target]);
}

export function getConnectedPath(edgeId: string, edges: GraphLayoutEdge[]): ConnectedPath {
  const selected = edges.find((edge) => edge.id === edgeId);
  if (!selected) return emptyConnectedPath();

  const edgeIds = new Set<string>();
  const nodeIds = new Set<string>([selected.source, selected.target]);
  const outgoing = new Map<string, GraphLayoutEdge[]>();
  const incoming = new Map<string, GraphLayoutEdge[]>();

  for (const edge of edges) {
    if (!edge.id) continue;
    const sourceList = outgoing.get(edge.source) ?? [];
    sourceList.push(edge);
    outgoing.set(edge.source, sourceList);

    const targetList = incoming.get(edge.target) ?? [];
    targetList.push(edge);
    incoming.set(edge.target, targetList);
  }

  const addEdge = (edge: GraphLayoutEdge) => {
    if (!edge.id || edgeIds.has(edge.id)) return false;
    edgeIds.add(edge.id);
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
    return true;
  };

  const walkUpstream = (nodeId: string) => {
    for (const edge of incoming.get(nodeId) ?? []) {
      if (addEdge(edge)) walkUpstream(edge.source);
    }
  };

  const walkDownstream = (nodeId: string) => {
    for (const edge of outgoing.get(nodeId) ?? []) {
      if (addEdge(edge)) walkDownstream(edge.target);
    }
  };

  addEdge(selected);
  walkUpstream(selected.source);
  walkDownstream(selected.target);

  return { edgeIds, nodeIds };
}

export function autoLayoutGraph(
  nodes: GraphLayoutNode[],
  edges: GraphLayoutEdge[],
  options: AutoLayoutOptions = {},
): Record<string, GraphPosition> {
  const {
    originX = 40,
    originY = 80,
    columnGap = 280,
    rowGap = 160,
  } = options;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const depthById = new Map(nodes.map((node) => [node.id, 0]));

  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
      const sourceDepth = depthById.get(edge.source) ?? 0;
      const targetDepth = depthById.get(edge.target) ?? 0;
      if (targetDepth < sourceDepth + 1) {
        depthById.set(edge.target, sourceDepth + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const originalIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const groups = new Map<number, GraphLayoutNode[]>();

  for (const node of nodes) {
    const depth = depthById.get(node.id) ?? 0;
    const group = groups.get(depth) ?? [];
    group.push(node);
    groups.set(depth, group);
  }

  const layout: Record<string, GraphPosition> = {};
  const sortedDepths = [...groups.keys()].sort((a, b) => a - b);

  for (const depth of sortedDepths) {
    const group = [...(groups.get(depth) ?? [])].sort((a, b) => {
      const yDiff = (a.position?.y ?? 0) - (b.position?.y ?? 0);
      if (yDiff !== 0) return yDiff;
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
    });

    const groupHeight = (group.length - 1) * rowGap;
    group.forEach((node, index) => {
      layout[node.id] = {
        x: originX + depth * columnGap,
        y: originY + index * rowGap - groupHeight / 2,
      };
    });
  }

  return layout;
}
