import { Point, ShapeBounds, ShapeType, Stroke } from '../../types/stroke';

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function isPointNearStroke(stroke: Stroke, point: Point, threshold: number): boolean {
  if (stroke.tool === 'shape' && stroke.shapeBounds) {
    const { x1, y1, x2, y2 } = stroke.shapeBounds;
    const minX = Math.min(x1, x2) - threshold;
    const maxX = Math.max(x1, x2) + threshold;
    const minY = Math.min(y1, y2) - threshold;
    const maxY = Math.max(y1, y2) + threshold;
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  if (stroke.tool === 'text' && stroke.shapeBounds) {
    const { x1, y1, x2, y2 } = stroke.shapeBounds;
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
  }

  const pts = stroke.points;
  const hitThreshold = threshold + stroke.width / 2;

  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanceToSegment(point.x, point.y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d <= hitThreshold) return true;
  }

  if (pts.length === 1) {
    return Math.hypot(point.x - pts[0].x, point.y - pts[0].y) <= hitThreshold;
  }

  return false;
}

export function findStrokesAtPoint(strokes: Stroke[], point: Point, eraserSize: number): string[] {
  const threshold = eraserSize / 2;
  const ids: string[] = [];

  for (let i = strokes.length - 1; i >= 0; i--) {
    if (isPointNearStroke(strokes[i], point, threshold)) {
      ids.push(strokes[i].id);
    }
  }

  return ids;
}

export function removeStrokesByIds(strokes: Stroke[], ids: Set<string>): Stroke[] {
  return strokes.filter((s) => !ids.has(s.id));
}

export function estimateTextBounds(text: string, x: number, y: number, fontSize: number): ShapeBounds {
  const width = text.length * fontSize * 0.6;
  const height = fontSize * 1.4;
  return { x1: x, y1: y - fontSize, x2: x + width, y2: y + height * 0.2 };
}

export type { ShapeBounds, ShapeType };
