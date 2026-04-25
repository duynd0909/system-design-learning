import { maskGraph } from '../mask';
import type { ProblemGraph } from '@joy/shared-types';

const makeGraph = (componentCount: number, actorCount = 1): ProblemGraph => ({
  nodes: [
    ...Array.from({ length: actorCount }, (_, i) => ({
      id: `actor-${i}`,
      type: 'actor' as const,
      position: { x: 0, y: i * 100 },
      data: { label: `Actor ${i}` },
    })),
    ...Array.from({ length: componentCount }, (_, i) => ({
      id: `comp-${i}`,
      type: 'component' as const,
      position: { x: 200, y: i * 100 },
      data: { componentSlug: `component-${i}`, label: `Component ${i}` },
    })),
  ],
  edges: [{ id: 'e1', source: 'actor-0', target: 'comp-0' }],
});

describe('maskGraph', () => {
  it('blanks exactly half of component nodes (floor)', () => {
    const graph = makeGraph(6);
    const result = maskGraph(graph, 'test');
    const blanks = result.nodes.filter((n) => n.type === 'blank');
    expect(blanks).toHaveLength(3);
  });

  it('blanks floor(n/2) for odd component counts', () => {
    const graph = makeGraph(5);
    const result = maskGraph(graph, 'test');
    const blanks = result.nodes.filter((n) => n.type === 'blank');
    expect(blanks).toHaveLength(2);
  });

  it('never blanks actor nodes', () => {
    const graph = makeGraph(4, 2);
    const result = maskGraph(graph, 'seed');
    const actorNodes = result.nodes.filter((n) => n.id.startsWith('actor'));
    actorNodes.forEach((n) => expect(n.type).toBe('actor'));
  });

  it('blank nodes have { isBlank: true } data', () => {
    const graph = makeGraph(4);
    const result = maskGraph(graph, 'seed');
    const blanks = result.nodes.filter((n) => n.type === 'blank');
    blanks.forEach((n) => expect(n.data).toEqual({ isBlank: true }));
  });

  it('preserves total node count', () => {
    const graph = makeGraph(8, 2);
    const result = maskGraph(graph, 'seed');
    expect(result.nodes).toHaveLength(graph.nodes.length);
  });

  it('preserves edges', () => {
    const graph = makeGraph(4);
    const result = maskGraph(graph, 'seed');
    expect(result.edges).toEqual(graph.edges);
  });

  it('is deterministic — same seed yields same blanked nodes', () => {
    const graph = makeGraph(8);
    const a = maskGraph(graph, 'fixed-seed');
    const b = maskGraph(graph, 'fixed-seed');
    const blankIdsA = a.nodes.filter((n) => n.type === 'blank').map((n) => n.id).sort();
    const blankIdsB = b.nodes.filter((n) => n.type === 'blank').map((n) => n.id).sort();
    expect(blankIdsA).toEqual(blankIdsB);
  });

  it('uses the current timestamp when no seed is provided', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(123456);
    const graph = makeGraph(4);
    const result = maskGraph(graph);

    expect(result.nodes.filter((n) => n.type === 'blank')).toHaveLength(2);
    now.mockRestore();
  });

  it('different seeds produce different blank selections', () => {
    const graph = makeGraph(10);
    const a = maskGraph(graph, 'seed-a');
    const b = maskGraph(graph, 'seed-b');
    const blankIdsA = a.nodes.filter((n) => n.type === 'blank').map((n) => n.id).sort().join(',');
    const blankIdsB = b.nodes.filter((n) => n.type === 'blank').map((n) => n.id).sort().join(',');
    expect(blankIdsA).not.toEqual(blankIdsB);
  });

  it('handles graph with zero components', () => {
    const graph = makeGraph(0);
    const result = maskGraph(graph, 'seed');
    expect(result.nodes.filter((n) => n.type === 'blank')).toHaveLength(0);
  });

  it('handles graph with one component — no blanks (floor(1/2) = 0)', () => {
    const graph = makeGraph(1);
    const result = maskGraph(graph, 'seed');
    expect(result.nodes.filter((n) => n.type === 'blank')).toHaveLength(0);
  });

  it('does not expose expected answer in blank node data', () => {
    const graph = makeGraph(6);
    const result = maskGraph(graph, 'seed');
    const blanks = result.nodes.filter((n) => n.type === 'blank');
    blanks.forEach((n) => {
      expect(n.data).not.toHaveProperty('componentSlug');
      expect(n.data).not.toHaveProperty('expected');
    });
  });
});
