import { buildAccumulatedGraph } from '../accumulate';
import type { GraphEdge, GraphNode } from '@stackdify/shared-types';

const node = (id: string, type: GraphNode['type'] = 'component'): GraphNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data:
    type === 'actor'
      ? { label: id }
      : { componentSlug: id, label: id },
});

const edge = (id: string, source: string, target: string): GraphEdge => ({
  id,
  source,
  target,
});

describe('buildAccumulatedGraph', () => {
  const requirements: Parameters<typeof buildAccumulatedGraph>[0] = [
    {
      order: 2,
      nodes: [node('cache'), node('db')],
      edges: [edge('e-app-cache', 'app', 'cache'), edge('e-app-db', 'app', 'db')],
      answer: { cache: 'cache' },
    },
    {
      order: 1,
      nodes: [node('user', 'actor'), node('app')],
      edges: [edge('e-user-app', 'user', 'app')],
      answer: { app: 'app-server' },
    },
    {
      order: 3,
      nodes: [node('queue')],
      edges: [edge('e-app-queue', 'app', 'queue')],
      answer: { queue: 'message-queue' },
    },
  ];

  it('reveals previous requirements and blanks only current answer nodes', () => {
    const result = buildAccumulatedGraph(requirements, 2, 'fixed');

    expect(result.nodes.map((n) => [n.id, n.type])).toEqual([
      ['user', 'actor'],
      ['app', 'component'],
      ['cache', 'blank'],
      ['db', 'component'],
    ]);
    expect(result.nodes.find((n) => n.id === 'cache')?.data).toEqual({ isBlank: true });
  });

  it('sorts requirements by order before accumulating', () => {
    const result = buildAccumulatedGraph(requirements, 3);

    expect(result.nodes.map((n) => n.id)).toEqual(['user', 'app', 'cache', 'db', 'queue']);
    expect(result.edges.map((e) => e.id)).toEqual(['e-user-app', 'e-app-cache', 'e-app-db', 'e-app-queue']);
  });

  it('stops before future requirements', () => {
    const result = buildAccumulatedGraph(requirements, 1);

    expect(result.nodes.map((n) => n.id)).toEqual(['user', 'app']);
    expect(result.edges.map((e) => e.id)).toEqual(['e-user-app']);
  });

  it('throws when the target requirement does not exist', () => {
    expect(() => buildAccumulatedGraph(requirements, 99)).toThrow('Requirement with order 99 not found');
  });
});
