import { describe, expect, it } from 'vitest';
import { buildGeometryScene } from './sceneBuilder';
import type { Stroke } from '../../types/stroke';

function lineStroke(id: string, x1: number, y1: number, x2: number, y2: number): Stroke {
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, pressure: 0.5, timestamp: i });
  }
  return { id, tool: 'pen', points, width: 3, color: '#000', finished: true };
}

describe('buildGeometryScene relations', () => {
  it('does not mark triangle sides as parallel', () => {
    const scene = buildGeometryScene([
      lineStroke('a', 100, 400, 400, 400),
      lineStroke('b', 400, 400, 400, 160),
      lineStroke('c', 400, 160, 100, 400),
    ]);
    expect(scene.segments.length).toBe(3);
    expect(scene.relations.filter((relation) => relation.type === 'parallel')).toHaveLength(0);
  });
});
