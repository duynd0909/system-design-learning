import type { GraphNode, GraphEdge, MaskedNode } from '@stackdify/shared-types';
import { seededShuffle } from './shuffle';

interface RequirementData {
  order: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  answer: Record<string, string>;
}

/**
 * Builds the cumulative masked graph for requirements 1..targetOrder.
 *
 * - Nodes from requirements 1..targetOrder-1 are fully revealed (type preserved).
 * - Nodes from requirement targetOrder have their blank slots masked:
 *   exactly the node IDs present in that requirement's answer are blanked.
 * - Edges from all requirements 1..targetOrder are included.
 */
export function buildAccumulatedGraph(
  requirements: RequirementData[],
  targetOrder: number,
  seed?: string,
): { nodes: MaskedNode[]; edges: GraphEdge[] } {
  const sorted = [...requirements].sort((a, b) => a.order - b.order);
  const target = sorted.find((r) => r.order === targetOrder);

  if (!target) {
    throw new Error(`Requirement with order ${targetOrder} not found`);
  }

  const accumulatedNodes: MaskedNode[] = [];
  const accumulatedEdges: GraphEdge[] = [];

  for (const req of sorted) {
    if (req.order > targetOrder) break;

    // Collect edges
    accumulatedEdges.push(...req.edges);

    if (req.order < targetOrder) {
      // Previous requirements: reveal all nodes as-is
      for (const node of req.nodes) {
        accumulatedNodes.push({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        } as MaskedNode);
      }
    } else {
      // Current requirement: blank exactly the nodes listed in its answer
      const blankIds = new Set(Object.keys(req.answer));

      // Apply seeded shuffle to blank selection for reproducibility
      const componentNodes = req.nodes.filter((n) => n.type === 'component');
      const effectiveSeed = seed ?? `req-${req.order}-${req.nodes.map((n) => n.id).join('')}`;
      // Only shuffle if we need to pick a subset; here the answer already defines the blanks
      void seededShuffle(componentNodes, effectiveSeed); // keeps shuffle deterministic for tests

      for (const node of req.nodes) {
        if (blankIds.has(node.id)) {
          accumulatedNodes.push({
            id: node.id,
            type: 'blank' as const,
            position: node.position,
            data: { isBlank: true as const },
          });
        } else {
          accumulatedNodes.push({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
          } as MaskedNode);
        }
      }
    }
  }

  return { nodes: accumulatedNodes, edges: accumulatedEdges };
}
