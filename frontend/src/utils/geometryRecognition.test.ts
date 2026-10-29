import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, screenToBoardPoint } from './boardCoordinates';
import {
  fitCircle,
  recognizeGeometry,
  recognizeLine,
} from './geometryRecognition';
import { dist } from './geometryMath';
import { SHAPE_LIBRARY, shapeIdFor } from './shapeLibrary';
import {
  computeTriangleMetrics,
  makeEquilateral,
  makeIsosceles,
  makeRight,
} from './triangleRecognition';
import type { Point, TriangleGeometry } from '../types/whiteboardGeometry';

function linePoints(x1: number, y1: number, x2: number, y2: number, wobble = 0): Point[] {
  const points: Point[] = [];
  const steps = 20;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const offset = wobble ? Math.sin(t * Math.PI * 4) * wobble : 0;
    points.push({
      x: x1 + dx * t + nx * offset,
      y: y1 + dy * t + ny * offset,
    });
  }
  return points;
}

function circlePoints(
  cx: number,
  cy: number,
  radius: number,
  steps = 48,
  wobble = 2,
  closureGap = 0
): Point[] {
  const points: Point[] = [];
  const count = steps - closureGap;
  for (let i = 0; i <= count; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const offset = Math.sin(i * 1.7) * wobble;
    points.push({
      x: cx + Math.cos(angle) * (radius + offset),
      y: cy + Math.sin(angle) * (radius + offset * 0.6),
    });
  }
  return points;
}

function arcPoints(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
  steps = 28,
  wobble = 1.5
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = start + (end - start) * t;
    const offset = Math.sin(t * Math.PI * 3) * wobble;
    points.push({
      x: cx + Math.cos(angle) * (radius + offset),
      y: cy + Math.sin(angle) * (radius + offset * 0.5),
    });
  }
  return points;
}

function polyline(corners: Point[], stepsPerSide = 16, wobble = 2): Point[] {
  const points: Point[] = [];
  for (let s = 0; s < corners.length - 1; s += 1) {
    const start = corners[s];
    const end = corners[s + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    for (let i = 0; i < stepsPerSide; i += 1) {
      const t = i / stepsPerSide;
      const offset = wobble * Math.sin(t * Math.PI * 3 + s);
      points.push({
        x: start.x + dx * t + nx * offset,
        y: start.y + dy * t + ny * offset,
      });
    }
  }
  points.push(corners[corners.length - 1]);
  return points;
}

function triangleStroke(a: Point, b: Point, c: Point, wobble = 2, closeGap = 0): Point[] {
  const points = polyline([a, b, c, a], 16, wobble);
  if (closeGap > 0) {
    return points.slice(0, Math.max(8, points.length - closeGap));
  }
  return points;
}

function asTriangle(result: { geometry: { type: string } }): TriangleGeometry {
  expect(result.geometry.type).toBe('triangle');
  return result.geometry as TriangleGeometry;
}

function almostEqualSides(a: number, b: number, c: number, digits = 4) {
  expect(a).toBeCloseTo(b, digits);
  expect(b).toBeCloseTo(c, digits);
}

describe('boardCoordinates', () => {
  it('maps screen positions into stable logical board coordinates', () => {
    const canvas = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 600,
        height: 350,
        right: 600,
        bottom: 350,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    const center = screenToBoardPoint(300, 175, canvas);
    expect(center.x).toBeCloseTo(BOARD_WIDTH / 2, 5);
    expect(center.y).toBeCloseTo(BOARD_HEIGHT / 2, 5);
  });

  it('does not change logical coordinates when the CSS viewport changes', () => {
    const small = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 300,
        height: 175,
        right: 310,
        bottom: 195,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;
    const large = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 900,
        height: 525,
        right: 910,
        bottom: 545,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    const a = screenToBoardPoint(10 + 150, 20 + 87.5, small);
    const b = screenToBoardPoint(10 + 450, 20 + 262.5, large);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(a.y).toBeCloseTo(b.y, 5);
  });
});

describe('geometryRecognition', () => {
  it('recognizes a rough horizontal line', () => {
    const result = recognizeGeometry(linePoints(100, 200, 500, 210, 2));
    expect(result.geometry.type).toBe('line');
    expect(
      result.geometry.type === 'line' && Math.abs(result.geometry.end.y - result.geometry.start.y)
    ).toBeLessThan(3);
  });

  it('recognizes a rough vertical line', () => {
    const result = recognizeGeometry(linePoints(300, 100, 308, 500, 2));
    expect(result.geometry.type).toBe('line');
    if (result.geometry.type === 'line') {
      expect(Math.abs(result.geometry.end.x - result.geometry.start.x)).toBeLessThan(3);
    }
  });

  it('recognizes a rough 45 degree line', () => {
    const result = recognizeGeometry(linePoints(100, 100, 400, 400, 2));
    expect(result.geometry.type).toBe('line');
    if (result.geometry.type === 'line') {
      const angleDeg = (result.geometry.angle * 180) / Math.PI;
      expect(Math.abs(angleDeg - 45)).toBeLessThan(8);
    }
  });

  it('recognizes a small closed circle', () => {
    const result = recognizeGeometry(circlePoints(400, 300, 40, 40, 1.2));
    expect(result.geometry.type).toBe('circle');
    if (result.geometry.type === 'circle') {
      expect(result.geometry.radius).toBeGreaterThan(30);
      expect(result.geometry.radius).toBeLessThan(50);
    }
  });

  it('recognizes a large shaky circle', () => {
    const result = recognizeGeometry(circlePoints(500, 320, 140, 64, 4));
    expect(result.geometry.type).toBe('circle');
    if (result.geometry.type === 'circle') {
      expect(result.geometry.radius).toBeGreaterThan(120);
      expect(result.geometry.radius).toBeLessThan(160);
    }
  });

  it('recognizes a slightly imperfectly closed circle', () => {
    const result = recognizeGeometry(circlePoints(420, 280, 80, 48, 2.5, 3));
    expect(result.geometry.type).toBe('circle');
  });

  it('recognizes a general circular arc', () => {
    const result = recognizeGeometry(arcPoints(400, 350, 100, -Math.PI * 0.8, -Math.PI * 0.2));
    expect(result.geometry.type).toBe('arc');
    if (result.geometry.type === 'arc') {
      expect(result.geometry.radius).toBeGreaterThan(80);
      expect(typeof result.geometry.clockwise).toBe('boolean');
    }
  });

  it('recognizes an upper left-to-right semicircle', () => {
    const result = recognizeGeometry(arcPoints(400, 340, 110, Math.PI, 0, 32, 2));
    expect(result.geometry.type).toBe('semicircle');
    if (result.geometry.type === 'semicircle') {
      expect(Math.abs(Math.abs(result.geometry.endAngle - result.geometry.startAngle) - Math.PI)).toBeLessThan(
        1e-6
      );
    }
  });

  it('recognizes a lower right-to-left semicircle', () => {
    const result = recognizeGeometry(arcPoints(380, 300, 90, 0, Math.PI, 30, 1.8));
    expect(result.geometry.type).toBe('semicircle');
  });

  it('recognizes left-facing and right-facing semicircles', () => {
    const left = recognizeGeometry(arcPoints(420, 310, 95, -Math.PI / 2, Math.PI / 2, 30, 1.5));
    const right = recognizeGeometry(arcPoints(420, 310, 95, Math.PI / 2, (3 * Math.PI) / 2, 30, 1.5));
    expect(left.geometry.type).toBe('semicircle');
    expect(right.geometry.type).toBe('semicircle');
  });

  it('recognizes a small and a large triangle', () => {
    const small = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 300, y: 260 }, { x: 250, y: 340 }, { x: 360, y: 338 }, 1.2)
      )
    );
    const large = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 200, y: 80 }, { x: 80, y: 520 }, { x: 620, y: 500 }, 3)
      )
    );
    expect(small.vertices).toHaveLength(3);
    expect(large.size).toBeGreaterThan(small.size);
  });

  it('recognizes a rotated shaky triangle', () => {
    const result = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 480, y: 140 }, { x: 620, y: 360 }, { x: 250, y: 300 }, 3.5)
      )
    );
    expect(result.classification).toBeTruthy();
  });

  it('recognizes a slightly open triangle', () => {
    const result = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 240, y: 150 }, { x: 160, y: 430 }, { x: 520, y: 410 }, 2, 6)
      )
    );
    expect(result.vertices).toHaveLength(3);
  });

  it('reconstructs an approximately equilateral triangle with equal sides and 60° angles', () => {
    const side = 180;
    const height = (side * Math.sqrt(3)) / 2;
    const a = { x: 400, y: 140 };
    const b = { x: 400 - side / 2 + 4, y: 140 + height - 3 };
    const c = { x: 400 + side / 2 - 2, y: 140 + height + 5 };
    const result = asTriangle(recognizeGeometry(triangleStroke(a, b, c, 2.5)));
    expect(result.classification).toBe('equilateral');
    almostEqualSides(result.sideLengths[0], result.sideLengths[1], result.sideLengths[2]);
    for (const angle of result.angles) {
      expect((angle * 180) / Math.PI).toBeCloseTo(60, 4);
    }
    expect(shapeIdFor(result)).toBe('EQUILATERAL_TRIANGLE');
  });

  it('enforces two equal sides on an approximately isosceles triangle', () => {
    const result = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 400, y: 120 }, { x: 250, y: 430 }, { x: 545, y: 438 }, 2)
      )
    );
    expect(result.classification).toBe('isosceles');
    const [ab, bc, ca] = result.sideLengths;
    const diffs = [Math.abs(ab - bc), Math.abs(bc - ca), Math.abs(ca - ab)];
    expect(Math.min(...diffs)).toBeLessThan(1e-6);
    expect(shapeIdFor(result)).toBe('ISOSCELES_TRIANGLE');
  });

  it('enforces a true 90° angle on an approximately right triangle', () => {
    const result = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 220, y: 430 }, { x: 228, y: 160 }, { x: 510, y: 438 }, 2.2)
      )
    );
    expect(result.classification).toBe('right');
    const rightAngle = Math.max(...result.angles);
    expect((rightAngle * 180) / Math.PI).toBeCloseTo(90, 4);
    expect(result.rightVertexIndex).toBeDefined();
    expect(result.hypotenuse).toBeDefined();
    expect(shapeIdFor(result)).toBe('RIGHT_TRIANGLE');
  });

  it('still recognizes a scalene triangle without forcing a stronger class', () => {
    const result = asTriangle(
      recognizeGeometry(
        triangleStroke({ x: 200, y: 300 }, { x: 400, y: 300 }, { x: 120, y: 526 }, 1.2)
      )
    );
    expect(result.classification).toBe('general');
    expect(shapeIdFor(result)).toBe('TRIANGLE');
  });

  it('falls back to freehand for scribbles, random curves, and incomplete shapes', () => {
    const scribble: Point[] = [
      { x: 100, y: 100 },
      { x: 180, y: 220 },
      { x: 120, y: 360 },
      { x: 260, y: 280 },
      { x: 300, y: 420 },
      { x: 210, y: 390 },
    ];
    const curve = linePoints(120, 200, 520, 240, 40).map((point, i) => ({
      x: point.x,
      y: point.y + Math.sin(i / 2) * 55,
    }));
    const incomplete = polyline(
      [
        { x: 200, y: 200 },
        { x: 260, y: 360 },
        { x: 400, y: 420 },
      ],
      12,
      4
    );

    expect(recognizeGeometry(scribble).geometry.type).toBe('freehand');
    expect(recognizeGeometry(curve).geometry.type).toBe('freehand');
    expect(recognizeGeometry(incomplete).geometry.type).not.toBe('circle');
    expect(recognizeGeometry(incomplete).geometry.type).not.toBe('triangle');
  });

  it('fits circle center and radius from sampled points', () => {
    const fit = fitCircle(circlePoints(500, 250, 60, 40, 0.4));
    expect(fit).not.toBeNull();
    expect(fit!.center.x).toBeCloseTo(500, 0);
    expect(fit!.center.y).toBeCloseTo(250, 0);
    expect(fit!.radius).toBeCloseTo(60, 0);
  });

  it('preserves intended line length when snapping angle', () => {
    const points = linePoints(200, 200, 420, 230, 1.5);
    const result = recognizeLine(points);
    expect(result?.geometry.type).toBe('line');
    if (result?.geometry.type === 'line') {
      const rawLength = Math.hypot(420 - 200, 230 - 200);
      const cleanLength = Math.hypot(
        result.geometry.end.x - result.geometry.start.x,
        result.geometry.end.y - result.geometry.start.y
      );
      expect(Math.abs(cleanLength - rawLength)).toBeLessThan(5);
    }
  });
});

describe('triangle construction', () => {
  it('builds a mathematically equilateral triangle from noisy vertices', () => {
    const vertices = makeEquilateral([
      { x: 200, y: 100 },
      { x: 80, y: 310 },
      { x: 330, y: 300 },
    ]);
    const metrics = computeTriangleMetrics(vertices);
    almostEqualSides(metrics.sideLengths[0], metrics.sideLengths[1], metrics.sideLengths[2]);
    for (const angle of metrics.angles) {
      expect((angle * 180) / Math.PI).toBeCloseTo(60, 5);
    }
  });

  it('builds an isosceles triangle that preserves the base', () => {
    const original: [Point, Point, Point] = [
      { x: 300, y: 80 },
      { x: 140, y: 360 },
      { x: 470, y: 360 },
    ];
    const result = makeIsosceles(original, 0);
    expect(dist(result[1], original[1])).toBeLessThan(1e-9);
    expect(dist(result[2], original[2])).toBeLessThan(1e-9);
    const metrics = computeTriangleMetrics(result);
    expect(metrics.sideLengths[0]).toBeCloseTo(metrics.sideLengths[2], 6);
  });

  it('builds a right triangle with an exact 90° corner', () => {
    const original: [Point, Point, Point] = [
      { x: 180, y: 400 },
      { x: 190, y: 140 },
      { x: 470, y: 410 },
    ];
    const result = makeRight(original, 0, false);
    const metrics = computeTriangleMetrics(result);
    expect((metrics.angles[0] * 180) / Math.PI).toBeCloseTo(90, 5);
  });
});

describe('shape library', () => {
  it('registers the MVP parametric shapes', () => {
    const ids = SHAPE_LIBRARY.map((shape) => shape.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'TRIANGLE',
        'EQUILATERAL_TRIANGLE',
        'ISOSCELES_TRIANGLE',
        'RIGHT_TRIANGLE',
        'CIRCLE',
        'SEMICIRCLE',
        'ARC',
        'FREEHAND',
      ])
    );
  });
});
