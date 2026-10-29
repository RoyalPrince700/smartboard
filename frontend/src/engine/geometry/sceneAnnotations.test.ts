import { describe, expect, it } from 'vitest';
import { attachLabelRecognitions, rebuildSceneAngles } from './sceneAnnotations';
import type { GeometryScene } from '../../types/geometry';
import type { Stroke } from '../../types/stroke';

function lineStroke(id: string, x1: number, y1: number, x2: number, y2: number): Stroke {
  const points = [];
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, pressure: 0.5, timestamp: i });
  }
  return { id, tool: 'pen', points, width: 3, color: '#000', finished: true };
}

describe('sceneAnnotations', () => {
  it('attaches side labels to nearest segment', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [
        { id: 'A', x: 100, y: 300 },
        { id: 'B', x: 500, y: 300 },
        { id: 'C', x: 300, y: 100 },
      ],
      segments: [
        { id: 'seg-1', p1: 'A', p2: 'B', length: 400, angleDeg: 0, kind: 'side' },
        { id: 'seg-2', p1: 'B', p2: 'C', length: 360, angleDeg: 56, kind: 'side' },
        { id: 'seg-3', p1: 'C', p2: 'A', length: 360, angleDeg: -56, kind: 'side' },
      ],
      angles: [],
      labels: [],
      relations: [],
      shapes: [
        {
          id: 'tri',
          type: 'triangle',
          confidence: 0.9,
          vertices: [
            { id: 'A', x: 100, y: 300 },
            { id: 'B', x: 500, y: 300 },
            { id: 'C', x: 300, y: 100 },
          ],
          edges: [
            { from: 'A', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'A' },
          ],
        },
      ],
    };

    const updated = attachLabelRecognitions(scene, [
      {
        strokeId: 'label-left',
        text: '6',
        confidence: 0.8,
        centroid: { x: 180, y: 250 },
      },
      {
        strokeId: 'label-right',
        text: '6',
        confidence: 0.8,
        centroid: { x: 420, y: 250 },
      },
    ]);

    expect(updated.labels.length).toBe(2);
    expect(updated.segments.some((segment) => segment.label === '6')).toBe(true);
  });

  it('treats a 0 near a vertex as theta, not a side length', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [
        { id: 'A', x: 100, y: 400 },
        { id: 'B', x: 500, y: 400 },
        { id: 'C', x: 500, y: 120 },
      ],
      segments: [
        { id: 'seg-1', p1: 'A', p2: 'B', length: 400, angleDeg: 0, kind: 'side' },
        { id: 'seg-2', p1: 'B', p2: 'C', length: 280, angleDeg: 90, kind: 'side' },
        { id: 'seg-3', p1: 'C', p2: 'A', length: 480, angleDeg: 35, kind: 'side' },
      ],
      angles: [],
      labels: [],
      relations: [],
    };

    const updated = attachLabelRecognitions(scene, [
      { strokeId: 'two', text: '2', confidence: 0.8, centroid: { x: 70, y: 260 } },
      { strokeId: 'six', text: '6', confidence: 0.8, centroid: { x: 280, y: 230 } },
      { strokeId: 'theta', text: '0', confidence: 0.6, centroid: { x: 470, y: 380 } },
      { strokeId: 'false-seven', text: '7', confidence: 0.4, centroid: { x: 200, y: 390 }, source: 'digit-guess' },
    ]);

    expect(updated.labels.some((label) => label.text === 'θ' && label.kind === 'angle')).toBe(true);
    expect(updated.labels.some((label) => label.text === '2' && label.kind === 'side')).toBe(true);
    expect(updated.labels.some((label) => label.text === '6' && label.kind === 'side')).toBe(true);
    expect(updated.labels.some((label) => label.text === '7' || label.text === '0')).toBe(false);
  });

  it('rebuilds marked angles at triangle vertices', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [
        { id: 'A', x: 100, y: 400 },
        { id: 'B', x: 500, y: 400 },
        { id: 'C', x: 300, y: 120 },
      ],
      segments: [
        { id: 'seg-1', p1: 'A', p2: 'B', length: 400, angleDeg: 0, kind: 'side' },
        { id: 'seg-2', p1: 'B', p2: 'C', length: 380, angleDeg: 58, kind: 'side' },
        { id: 'seg-3', p1: 'C', p2: 'A', length: 380, angleDeg: -58, kind: 'side' },
      ],
      angles: [],
      labels: [],
      relations: [],
    };

    const arcA = lineStroke('arc-a', 130, 370, 170, 385);
    const arcB = lineStroke('arc-b', 470, 370, 430, 385);

    const updated = rebuildSceneAngles(scene, [arcA, arcB]);
    const marked = updated.angles.filter((angle) => angle.isMarked);
    expect(marked.length).toBeGreaterThanOrEqual(2);
  });
});
