import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { geometryRecognizer } from './GeometryRecognizer';
import { geometrySceneBuilder } from './GeometrySceneBuilder';
import { diagramEngine } from './DiagramEngine';
import { Stroke } from '../../types/stroke';

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

describe('GeometryRecognizer', () => {
  it('recognises a triangle drawn as three connected lines', () => {
    const strokes = [
      lineStroke('a', 100, 400, 400, 400),
      lineStroke('b', 400, 400, 100, 160),
      lineStroke('c', 100, 160, 100, 400),
    ];
    const shapes = geometryRecognizer.recognize(strokes);
    assert.ok(shapes.some((shape) => shape.type === 'triangle'));
  });

  it('recognises a rectangle from the shape tool', () => {
    const strokes: Stroke[] = [
      {
        id: 'rect',
        tool: 'shape',
        shapeType: 'rectangle',
        shapeBounds: { x1: 40, y1: 40, x2: 200, y2: 140 },
        points: [],
        width: 2,
        color: '#000',
        finished: true,
      },
    ];
    const shapes = geometryRecognizer.recognize(strokes);
    assert.equal(shapes[0].type, 'rectangle');
    assert.ok((shapes[0].confidence ?? 0) >= 0.9);
  });

  it('builds a scene from an angle diagram and redraws it', () => {
    const strokes = [
      lineStroke('top', 80, 100, 560, 100),
      lineStroke('bottom', 60, 360, 620, 340),
      lineStroke('left', 210, 355, 340, 110),
      lineStroke('right', 340, 110, 460, 350),
    ];
    const scene = geometrySceneBuilder.build(strokes, ['58']);
    assert.ok(scene.segments.length >= 4);
    assert.ok(scene.points.length >= 4);
    assert.ok(scene.relations.some((relation) => relation.type === 'parallel'));

    const diagram = diagramEngine.generateFromScene(scene);
    assert.ok(diagram);
    assert.equal(diagram!.category, 'geometry');
    assert.ok(diagram!.elements.some((element) => element.type === 'line'));
  });

  it('builds a clean triangle diagram from recognized geometry values', () => {
    const diagram = diagramEngine.generateFromRecognizedData({
      shapeType: 'triangle',
      sides: [2, 6],
      unit: 'cm',
      isRightTriangle: true,
      angleLabel: 'θ',
    });
    assert.ok(diagram);
    assert.equal(diagram!.category, 'geometry');
    assert.ok(diagram!.elements.some((element) => element.type === 'triangle'));
    assert.ok(diagram!.elements.some((element) => element.type === 'label' && element.text?.includes('2')));
  });
});
