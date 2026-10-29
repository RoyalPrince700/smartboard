import { describe, expect, it } from 'vitest';
import { renderGeometrySceneToDiagram } from '../diagram/svgGeometryRenderer';
import type { GeometryScene } from '../../types/geometry';

describe('renderGeometrySceneToDiagram', () => {
  it('preserves a wide triangle proportions', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [],
      segments: [],
      angles: [],
      labels: [],
      relations: [],
      bounds: { x1: 80, y1: 120, x2: 520, y2: 320 },
      shapes: [
        {
          id: 'shape_1',
          type: 'triangle',
          confidence: 0.9,
          vertices: [
            { id: 'A', x: 100, y: 300 },
            { id: 'B', x: 500, y: 300 },
            { id: 'C', x: 300, y: 140 },
          ],
          edges: [
            { from: 'A', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'A' },
          ],
        },
      ],
    };

    const diagram = renderGeometrySceneToDiagram(scene);
    expect(diagram).not.toBeNull();
    const triangle = diagram!.elements.find((element) => element.type === 'triangle');
    expect(triangle?.points?.length).toBe(3);
    const xs = triangle!.points!.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(180);
  });

  it('renders a tilted rectangle from vertices', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [],
      segments: [],
      angles: [],
      labels: [],
      relations: [],
      bounds: { x1: 100, y1: 100, x2: 400, y2: 350 },
      shapes: [
        {
          id: 'rect_1',
          type: 'rectangle',
          confidence: 0.85,
          vertices: [
            { id: 'A', x: 120, y: 140 },
            { id: 'B', x: 380, y: 120 },
            { id: 'C', x: 360, y: 320 },
            { id: 'D', x: 100, y: 340 },
          ],
          edges: [
            { from: 'A', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'D' },
            { from: 'D', to: 'A' },
          ],
        },
      ],
    };

    const diagram = renderGeometrySceneToDiagram(scene);
    const polygon = diagram!.elements.find((element) => element.type === 'polygon');
    expect(polygon?.points?.length).toBe(4);
  });

  it('adds a right-angle square, interior arcs, and side numbers on a right triangle', () => {
    const scene: GeometryScene = {
      type: 'geometry_scene',
      points: [
        { id: 'A', x: 100, y: 300 },
        { id: 'B', x: 260, y: 300 },
        { id: 'C', x: 260, y: 180 },
      ],
      segments: [
        { id: 'seg-1', p1: 'A', p2: 'B', length: 160, angleDeg: 0, kind: 'side', label: '6' },
        { id: 'seg-2', p1: 'B', p2: 'C', length: 120, angleDeg: 90, kind: 'side', label: '2' },
        { id: 'seg-3', p1: 'C', p2: 'A', length: 200, angleDeg: 37, kind: 'side' },
      ],
      angles: [
        { id: 'angle-B', vertex: 'B', ray1: 'seg-1', ray2: 'seg-2', valueDeg: 90, isMarked: true },
        { id: 'angle-A', vertex: 'A', ray1: 'seg-1', ray2: 'seg-3', valueDeg: 37, isMarked: true },
      ],
      labels: [
        { id: 'l2', text: '2', x: 80, y: 240, targetId: 'seg-2', kind: 'side' },
        { id: 'l6', text: '6', x: 180, y: 270, targetId: 'seg-1', kind: 'side' },
      ],
      relations: [],
      bounds: { x1: 80, y1: 160, x2: 280, y2: 320 },
      shapes: [
        {
          id: 'shape_1',
          type: 'triangle',
          confidence: 0.9,
          vertices: [
            { id: 'A', x: 100, y: 300 },
            { id: 'B', x: 260, y: 300 },
            { id: 'C', x: 260, y: 180 },
          ],
          edges: [
            { from: 'A', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'A' },
          ],
        },
      ],
    };

    const diagram = renderGeometrySceneToDiagram(scene);
    expect(diagram).not.toBeNull();
    const labels = diagram!.elements.filter((element) => element.type === 'label').map((element) => element.text);
    expect(labels).toContain('2');
    expect(labels).toContain('6');
    expect(labels.some((text) => text === 'mmm')).toBe(false);

    const arcs = diagram!.elements.filter((element) => element.type === 'arc');
    expect(arcs.length).toBeGreaterThanOrEqual(1);
    expect(arcs.every((arc) => arc.startAngle !== undefined && arc.endAngle !== undefined)).toBe(true);

    const extraLines = diagram!.elements.filter((element) => element.type === 'line');
    expect(extraLines.length).toBeGreaterThanOrEqual(2);
  });
});
