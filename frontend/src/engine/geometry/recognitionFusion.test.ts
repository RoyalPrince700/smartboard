import { describe, expect, it } from 'vitest';
import { fuseRecognizedShapes } from './recognitionFusion';
import type { RecognizedShape } from '../../types/geometry';

function shape(partial: Partial<RecognizedShape> & Pick<RecognizedShape, 'type' | 'confidence'>): RecognizedShape {
  return {
    id: partial.id ?? 's1',
    strokeId: partial.strokeId ?? 'stroke-1',
    type: partial.type,
    confidence: partial.confidence,
    measurements: partial.measurements ?? [],
    labels: partial.labels ?? [],
    vertices: partial.vertices,
    edges: partial.edges,
    source: partial.source,
  };
}

describe('fuseRecognizedShapes', () => {
  it('boosts confidence when both recognizers agree on triangle', () => {
    const vertices = [
      { id: 'A', x: 100, y: 300 },
      { id: 'B', x: 300, y: 100 },
      { id: 'C', x: 500, y: 300 },
    ];
    const heuristic = [shape({ type: 'triangle', confidence: 0.91, vertices, source: 'heuristic' })];
    const opencv = [shape({ type: 'triangle', confidence: 0.96, vertices, source: 'opencv' })];
    const result = fuseRecognizedShapes(heuristic, opencv);
    expect(result.shapes[0].type).toBe('triangle');
    expect(result.shapes[0].confidence).toBeGreaterThan(0.93);
    expect(result.meta.fused?.agreement).toBe(true);
  });

  it('falls back to heuristic when OpenCV is empty', () => {
    const heuristic = [shape({ type: 'rectangle', confidence: 0.8 })];
    const result = fuseRecognizedShapes(heuristic, []);
    expect(result.shapes[0].type).toBe('rectangle');
    expect(result.shapes[0].source).toBe('heuristic');
  });

  it('marks disagreement with reduced confidence', () => {
    const heuristic = [shape({ type: 'triangle', confidence: 0.82 })];
    const opencv = [shape({ type: 'polygon', confidence: 0.79 })];
    const result = fuseRecognizedShapes(heuristic, opencv);
    expect(result.meta.fused?.agreement).toBe(false);
    expect(result.shapes[0].confidence).toBeLessThan(0.82);
  });
});
