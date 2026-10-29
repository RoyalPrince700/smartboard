import type { Point } from '../types/whiteboardGeometry';

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(point: Point, factor: number): Point {
  return { x: point.x * factor, y: point.y * factor };
}

export function length(vector: Point): number {
  return Math.hypot(vector.x, vector.y);
}

export function normalize(vector: Point): Point {
  const mag = length(vector);
  if (mag < 1e-9) return { x: 0, y: 0 };
  return { x: vector.x / mag, y: vector.y / mag };
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
}

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

export function boundingBox(points: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  diagonal: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    diagonal: Math.hypot(width, height),
  };
}

export function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq)
  );

  return Math.hypot(point.x - (lineStart.x + t * dx), point.y - (lineStart.y + t * dy));
}

export function pointToInfiniteLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return dist(point, lineStart);
  return Math.abs(cross(subtract(point, lineStart), { x: dx, y: dy })) / Math.sqrt(lengthSq);
}

export function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs(cross(subtract(b, a), subtract(c, a))) / 2;
}

/** Interior angle at `vertex` formed by points `from` and `to`. */
export function interiorAngle(vertex: Point, from: Point, to: Point): number {
  const v1 = subtract(from, vertex);
  const v2 = subtract(to, vertex);
  const mag = length(v1) * length(v2);
  if (mag < 1e-9) return 0;
  const cosine = Math.min(1, Math.max(-1, dot(v1, v2) / mag));
  return Math.acos(cosine);
}

export function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points.map((point) => ({ ...point }));

  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= epsilon) {
    return [{ ...start }, { ...end }];
  }

  const left = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
  const right = ramerDouglasPeucker(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

export function nearestIndex(points: Point[], target: Point): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const distance = dist(points[i], target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

export function clusterNearbyPoints(points: Point[], threshold: number): Point[] {
  if (points.length === 0) return [];

  const clusters: Point[][] = [];
  for (const point of points) {
    const existing = clusters.find((cluster) => cluster.some((member) => dist(member, point) <= threshold));
    if (existing) existing.push(point);
    else clusters.push([point]);
  }

  return clusters.map((cluster) => centroid(cluster));
}

export function wrapDelta(delta: number): number {
  let value = delta;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

export function relativeDifference(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return Math.abs(a - b) / max;
}

export function asVertexIndex(index: number): 0 | 1 | 2 {
  const normalized = ((index % 3) + 3) % 3;
  if (normalized === 0) return 0;
  if (normalized === 1) return 1;
  return 2;
}
