import { describe, expect, it } from 'vitest';
import {
  classifyGeometryStroke,
  isAngleArcStroke,
  isCompactLabelStroke,
  isRightAngleMarkStroke,
} from './strokeRoles';
import type { Stroke } from '../../types/stroke';

function strokeFrom(id: string, points: Array<{ x: number; y: number }>): Stroke {
  return {
    id,
    tool: 'pen',
    points: points.map((p, i) => ({ ...p, pressure: 0.5, timestamp: i })),
    width: 3,
    color: '#000',
    finished: true,
  };
}

function line(x1: number, y1: number, x2: number, y2: number) {
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return points;
}

function digitTwo() {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 8; i += 1) points.push({ x: 20 + i * 4, y: 12 + Math.sin((i / 8) * Math.PI) * 6 });
  for (let i = 1; i <= 10; i += 1) points.push({ x: 52 - i * 3.2, y: 18 + i * 5 });
  for (let i = 1; i <= 8; i += 1) points.push({ x: 20 + i * 4.2, y: 70 });
  return points;
}

function quarterArc() {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 14; i += 1) {
    const a = (i / 14) * (Math.PI / 2);
    points.push({ x: 200 + 36 * Math.cos(a), y: 200 - 36 * Math.sin(a) });
  }
  return points;
}

function rightAngleBox() {
  const points: Array<{ x: number; y: number }> = [];
  const corners = [
    { x: 100, y: 100 },
    { x: 100, y: 78 },
    { x: 122, y: 78 },
    { x: 122, y: 100 },
    { x: 100, y: 100 },
  ];
  for (let i = 0; i < corners.length - 1; i += 1) {
    const a = corners[i];
    const b = corners[i + 1];
    for (let t = 0; t <= 4; t += 1) {
      points.push({ x: a.x + ((b.x - a.x) * t) / 4, y: a.y + ((b.y - a.y) * t) / 4 });
    }
  }
  return points;
}

describe('strokeRoles', () => {
  it('classifies long straight strokes as sides, not labels', () => {
    expect(classifyGeometryStroke(strokeFrom('side', line(100, 400, 100, 200)))).toBe('line');
  });

  it('keeps handwritten digits as labels instead of angle marks', () => {
    const two = digitTwo();
    expect(isCompactLabelStroke(two)).toBe(true);
    expect(isAngleArcStroke(two)).toBe(false);
    expect(classifyGeometryStroke(strokeFrom('two', two))).toBe('label');
  });

  it('classifies a quarter-circle as an angle mark', () => {
    const arc = quarterArc();
    expect(isAngleArcStroke(arc)).toBe(true);
    expect(classifyGeometryStroke(strokeFrom('arc', arc))).toBe('angleMark');
  });

  it('classifies a small right-angle box as an angle mark', () => {
    const box = rightAngleBox();
    expect(isRightAngleMarkStroke(box)).toBe(true);
    expect(classifyGeometryStroke(strokeFrom('sq', box))).toBe('angleMark');
  });
});
