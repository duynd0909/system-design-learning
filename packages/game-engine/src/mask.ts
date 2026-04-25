import type { ProblemGraph, MaskedGraph, MaskedNode } from '@joy/shared-types';
import { seededShuffle } from './shuffle';

export function maskGraph(graph: ProblemGraph, seed?: string): MaskedGraph {
  const componentNodes = graph.nodes.filter((n) => n.type === 'component');
  const blankCount = Math.floor(componentNodes.length / 2);
  const effectiveSeed = seed ?? String(Date.now());
  const shuffled = seededShuffle(componentNodes, effectiveSeed);
  const blankIds = new Set(shuffled.slice(0, blankCount).map((n) => n.id));

  const maskedNodes: MaskedNode[] = graph.nodes.map((n) => {
    if (blankIds.has(n.id)) {
      return {
        id: n.id,
        type: 'blank' as const,
        position: n.position,
        data: { isBlank: true as const },
      };
    }
    return {
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    } as MaskedNode;
  });

  return {
    nodes: maskedNodes,
    edges: graph.edges,
    // blankIds intentionally NOT returned — server-side only
  };
}
