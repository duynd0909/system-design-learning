import { describe, expect, it } from '@jest/globals';
import {
  categoryForComponent,
  edgeStatusStroke,
  inferEdgeKind,
  normalizeComponentCategory,
} from '../graph-config';

describe('graph-config', () => {
  it('normalizes seeded component categories into semantic UI groups', () => {
    expect(categoryForComponent({ slug: 'message-queue', category: 'messaging' })).toBe('async');
    expect(categoryForComponent({ slug: 'media-server', category: 'media' })).toBe('compute');
    expect(categoryForComponent({ slug: 'search-engine', category: 'data' })).toBe('storage');
    expect(categoryForComponent({ slug: 'dns', category: 'networking' })).toBe('networking');
  });

  it('keeps security as an extension-ready category', () => {
    expect(normalizeComponentCategory('security', 'waf')).toBe('security');
    expect(normalizeComponentCategory('auth', 'custom-auth')).toBe('security');
  });

  it('infers edge kinds from labels and endpoint context', () => {
    expect(inferEdgeKind({ label: 'enqueue job' })).toBe('async');
    expect(inferEdgeKind({ label: 'WebRTC relay' })).toBe('streaming');
    expect(inferEdgeKind({ label: 'cache read' })).toBe('cache');
    expect(inferEdgeKind({ label: 'read' }, { targetSlug: 'cache' })).toBe('cache');
    expect(inferEdgeKind({ label: 'metadata' })).toBe('request');
  });

  it('uses kind colors for normal edges and status colors for warnings/errors', () => {
    expect(edgeStatusStroke('cache', 'normal')).toBe('#10b981');
    expect(edgeStatusStroke('cache', 'active')).toBe('#059669');
    expect(edgeStatusStroke('request', 'warning')).toBe('#f59e0b');
    expect(edgeStatusStroke('streaming', 'error')).toBe('#ef4444');
  });
});
