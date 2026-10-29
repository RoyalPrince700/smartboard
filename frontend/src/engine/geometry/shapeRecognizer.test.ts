import { describe, expect, it } from 'vitest';
import { recognizeBoardShapes } from './shapeRecognizer';
import type { Stroke } from '../../types/stroke';

function lineStroke(id: string, x1: number, y1: number, x2: number, y2: number): Stroke {
  const points = [];
  const steps = 12;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      pressure: 0.5,
      timestamp: i,
    });
  }
  return {
    id,
    tool: 'pen',
    points,
    width: 3,
    color: '#000',
    finished: true,
  };
}

describe('recognizeBoardShapes', () => {
  it('recognizes triangle and returns vertices', () => {
    const strokes = [
      lineStroke('a', 100, 400, 400, 400),
      lineStroke('b', 400, 400, 250, 160),
      lineStroke('c', 250, 160, 100, 400),
    ];
    const shapes = recognizeBoardShapes(strokes);
    const triangle = shapes.find((shape) => shape.type === 'triangle');
    expect(triangle).toBeDefined();
    expect(triangle?.vertices?.length).toBeGreaterThanOrEqual(3);
  });

  it('recognizes a wide triangle with distinct vertex coordinates', () => {
    const strokes = [
      lineStroke('a', 50, 300, 550, 300),
      lineStroke('b', 550, 300, 300, 100),
      lineStroke('c', 300, 100, 50, 300),
    ];
    const shapes = recognizeBoardShapes(strokes);
    const triangle = shapes.find((shape) => shape.type === 'triangle');
    expect(triangle?.vertices?.length).toBe(3);
    const xs = triangle!.vertices!.map((v) => v.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(400);
  });

  it('recognizes horizontal line', () => {
    const strokes = [lineStroke('line', 80, 200, 420, 200)];
    const shapes = recognizeBoardShapes(strokes);
    expect(shapes.some((shape) => shape.type === 'line')).toBe(true);
  });
});
