import { describe, expect, it } from '@jest/globals';
import { autoLayoutGraph, getConnectedPath, getDirectEdgeNodes } from '../graph-utils';

describe('graph-utils', () => {
  const edges = [
    { id: 'e-user-dns', source: 'user', target: 'dns' },
    { id: 'e-dns-lb', source: 'dns', target: 'lb' },
    { id: 'e-lb-app', source: 'lb', target: 'app' },
    { id: 'e-app-cache', source: 'app', target: 'cache' },
    { id: 'e-app-db', source: 'app', target: 'db' },
  ];

  it('returns direct source and target nodes for a single edge', () => {
    expect([...getDirectEdgeNodes('e-lb-app', edges)].sort()).toEqual(['app', 'lb']);
    expect([...getDirectEdgeNodes('missing', edges)]).toEqual([]);
  });

  it('builds a directed highlighted path through upstream and downstream edges', () => {
    const path = getConnectedPath('e-lb-app', edges);

    expect([...path.edgeIds].sort()).toEqual([
      'e-app-cache',
      'e-app-db',
      'e-dns-lb',
      'e-lb-app',
      'e-user-dns',
    ]);
    expect([...path.nodeIds].sort()).toEqual(['app', 'cache', 'db', 'dns', 'lb', 'user']);
  });

  it('auto-layouts nodes into deterministic edge-depth columns', () => {
    const layout = autoLayoutGraph(
      [
        { id: 'app', position: { x: 840, y: 300 } },
        { id: 'user', position: { x: 0, y: 300 } },
        { id: 'dns', position: { x: 280, y: 180 } },
        { id: 'lb', position: { x: 560, y: 240 } },
      ],
      edges.slice(0, 3),
      { originX: 0, originY: 100, columnGap: 200, rowGap: 120 },
    );

    expect(layout.user).toEqual({ x: 0, y: 100 });
    expect(layout.dns).toEqual({ x: 200, y: 100 });
    expect(layout.lb).toEqual({ x: 400, y: 100 });
    expect(layout.app).toEqual({ x: 600, y: 100 });
  });

  it('stacks nodes in the same depth by their existing vertical order', () => {
    const layout = autoLayoutGraph(
      [
        { id: 'app-2', position: { x: 840, y: 340 } },
        { id: 'user', position: { x: 0, y: 220 } },
        { id: 'app-1', position: { x: 840, y: 120 } },
      ],
      [
        { id: 'e-user-app1', source: 'user', target: 'app-1' },
        { id: 'e-user-app2', source: 'user', target: 'app-2' },
      ],
      { originX: 20, originY: 200, columnGap: 280, rowGap: 160 },
    );

    expect(layout['app-1']).toEqual({ x: 300, y: 120 });
    expect(layout['app-2']).toEqual({ x: 300, y: 280 });
  });
});
