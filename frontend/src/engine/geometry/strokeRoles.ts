import type { Stroke } from '../../types/stroke';

export type GeometryStrokeRole = 'line' | 'label' | 'angleMark' | 'relationMark' | 'ignore';

export interface Point2 {
  x: number;
  y: number;
}

function dist(a: Point2, b: Point2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function strokePoints(stroke: Stroke): Point2[] {
  if (stroke.points.length >= 2) return stroke.points.map((p) => ({ x: p.x, y: p.y }));
  if (stroke.shapeBounds) {
    return [
      { x: stroke.shapeBounds.x1, y: stroke.shapeBounds.y1 },
      { x: stroke.shapeBounds.x2, y: stroke.shapeBounds.y2 },
    ];
  }
  return [];
}

export function boundsOf(points: Point2[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

export function maxDimOf(points: Point2[]): number {
  if (points.length === 0) return 0;
  const b = boundsOf(points);
  return Math.max(Math.abs(b.x2 - b.x1), Math.abs(b.y2 - b.y1));
}

export function centroidOfPoints(points: Point2[]): Point2 {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function maxPerpendicularDistance(points: Point2[], a: Point2, b: Point2): number {
  const span = dist(a, b) || 1;
  return points.reduce((max, point) => {
    const area = Math.abs((b.x - a.x) * (a.y - point.y) - (a.x - point.x) * (b.y - a.y));
    return Math.max(max, area / span);
  }, 0);
}

function ramerDouglasPeucker(points: Point2[], epsilon: number): Point2[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  const span = dist(start, end) || 1;

  for (let i = 1; i < points.length - 1; i += 1) {
    const area = Math.abs((end.x - start.x) * (start.y - points[i].y) - (start.x - points[i].x) * (end.y - start.y));
    const d = area / span;
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const right = ramerDouglasPeucker(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function cornerCount(points: Point2[], maxDim: number): number {
  const simplified = ramerDouglasPeucker(points, Math.max(2.5, maxDim * 0.08));
  return Math.max(0, simplified.length - 2);
}

function hasRightAngleCorner(points: Point2[], maxDim: number): boolean {
  const simplified = ramerDouglasPeucker(points, Math.max(2.5, maxDim * 0.07));
  if (simplified.length < 3) return false;
  for (let i = 1; i < simplified.length - 1; i += 1) {
    const a = simplified[i - 1];
    const b = simplified[i];
    const c = simplified[i + 1];
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 < 3 || mag2 < 3) continue;
    const cos = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
    const degrees = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    if (Math.abs(degrees - 90) <= 28) return true;
  }
  return false;
}

function isStraightEnough(points: Point2[]): boolean {
  const length = dist(points[0], points[points.length - 1]);
  const deviation = maxPerpendicularDistance(points, points[0], points[points.length - 1]);
  return deviation <= Math.max(8, length * 0.08);
}

/** Small square or L-shape drawn at a vertex to mark a right angle. */
export function isRightAngleMarkStroke(points: Point2[]): boolean {
  const maxDim = maxDimOf(points);
  if (maxDim < 14 || maxDim > 140) return false;
  const b = boundsOf(points);
  const width = Math.abs(b.x2 - b.x1);
  const height = Math.abs(b.y2 - b.y1);
  const aspect = Math.min(width, height) / Math.max(width, height, 1);
  const closed = dist(points[0], points[points.length - 1]) <= Math.max(10, maxDim * 0.28);
  if (closed && aspect >= 0.62) return true;
  const corners = cornerCount(points, maxDim);
  return aspect >= 0.72 && hasRightAngleCorner(points, maxDim) && corners >= 1 && corners <= 5;
}

/** Open curve that sits near a vertex — a textbook angle arc, not a digit. */
export function isAngleArcStroke(points: Point2[]): boolean {
  const maxDim = maxDimOf(points);
  if (maxDim < 16 || maxDim > 140) return false;
  if (isRightAngleMarkStroke(points)) return false;
  const chord = dist(points[0], points[points.length - 1]);
  const closed = chord <= Math.max(10, maxDim * 0.22);
  if (closed) return false;
  const b = boundsOf(points);
  const width = Math.abs(b.x2 - b.x1);
  const height = Math.abs(b.y2 - b.y1);
  if (height > width * 1.12) return false;
  const corners = cornerCount(points, maxDim);
  const chordRatio = chord / Math.max(maxDim, 1);
  return corners <= 3 && chordRatio >= 0.22 && chordRatio <= 1.55;
}

export function isCompactLabelStroke(points: Point2[]): boolean {
  const maxDim = maxDimOf(points);
  if (maxDim < 14 || maxDim > 160) return false;
  const b = boundsOf(points);
  const width = Math.abs(b.x2 - b.x1);
  const height = Math.abs(b.y2 - b.y1);
  if (width > height * 3.4 || height > width * 4.2) return false;
  if (isStraightEnough(points) && dist(points[0], points[points.length - 1]) > 70) return false;
  return true;
}

/**
 * Anything that should stay out of OpenCV contour detection:
 * handwritten numbers, angle arcs, and right-angle squares.
 */
export function isAnnotationStroke(stroke: Stroke): boolean {
  if (stroke.tool === 'text') return true;
  if (stroke.tool !== 'pen' && stroke.tool !== 'highlighter') return false;
  const points = strokePoints(stroke);
  if (points.length < 2) return false;
  const maxDim = maxDimOf(points);
  if (maxDim < 100 && points.length < 60) return true;
  return isRightAngleMarkStroke(points) || isAngleArcStroke(points) || isCompactLabelStroke(points);
}

export function classifyGeometryStroke(stroke: Stroke): GeometryStrokeRole {
  if (stroke.tool === 'text') return 'label';
  if (stroke.tool === 'shape') return 'line';
  if (stroke.tool !== 'pen' && stroke.tool !== 'highlighter') return 'ignore';

  const points = strokePoints(stroke);
  if (points.length < 2) return 'ignore';

  const maxDim = maxDimOf(points);
  const length = dist(points[0], points[points.length - 1]);
  const straight = isStraightEnough(points);

  if (straight && length > 36 && maxDim >= 36) return 'line';
  if (maxDim < 22) return 'relationMark';
  if (isRightAngleMarkStroke(points) || isAngleArcStroke(points)) return 'angleMark';
  if (isCompactLabelStroke(points)) return 'label';
  if (straight && length > 36) return 'line';
  if (maxDim < 36) return 'relationMark';
  return 'ignore';
}
