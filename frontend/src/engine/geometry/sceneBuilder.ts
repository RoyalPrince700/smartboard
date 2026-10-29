import type {
  GeometryScene,
  GeometrySceneAngle,
  GeometrySceneLabel,
  GeometryScenePoint,
  GeometrySceneRelation,
  GeometrySceneSegment,
} from '../../types/geometry';
import type { Stroke } from '../../types/stroke';
import { classifyGeometryStroke, strokePoints as roleStrokePoints } from './strokeRoles';
import { isUsefulGeometryLabel, sanitizeGeometryLabel } from './geometryLabelOcr';

interface Point {
  x: number;
  y: number;
}

interface SegmentCandidate {
  strokeId: string;
  p1: Point;
  p2: Point;
  length: number;
  angleDeg: number;
}

export interface SegmentedGeometryStrokes {
  lineStrokes: Stroke[];
  labelStrokes: Stroke[];
  angleMarkStrokes: Stroke[];
  relationMarkStrokes: Stroke[];
}

const POINT_IDS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function strokePoints(stroke: Stroke): Point[] {
  return roleStrokePoints(stroke);
}

function bounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

function angleDeg(a: Point, b: Point): number {
  const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return ((deg % 180) + 180) % 180;
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 180;
  return Math.min(diff, 180 - diff);
}

function centerOf(points: Point[]): Point {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function classifyStroke(stroke: Stroke): keyof SegmentedGeometryStrokes | 'ignore' {
  const role = classifyGeometryStroke(stroke);
  if (role === 'line') return 'lineStrokes';
  if (role === 'label') return 'labelStrokes';
  if (role === 'angleMark') return 'angleMarkStrokes';
  if (role === 'relationMark') return 'relationMarkStrokes';
  return 'ignore';
}

function segmentFromStroke(stroke: Stroke): SegmentCandidate | null {
  const points = strokePoints(stroke);
  if (points.length < 2) return null;
  const p1 = points[0];
  const p2 = points[points.length - 1];
  const length = dist(p1, p2);
  if (length < 30) return null;
  return { strokeId: stroke.id, p1, p2, length, angleDeg: angleDeg(p1, p2) };
}

function pointNearSegment(point: Point, segment: SegmentCandidate, tolerance: number): boolean {
  return (
    point.x >= Math.min(segment.p1.x, segment.p2.x) - tolerance &&
    point.x <= Math.max(segment.p1.x, segment.p2.x) + tolerance &&
    point.y >= Math.min(segment.p1.y, segment.p2.y) - tolerance &&
    point.y <= Math.max(segment.p1.y, segment.p2.y) + tolerance
  );
}

function lineIntersection(a: SegmentCandidate, b: SegmentCandidate): Point | null {
  const { x: x1, y: y1 } = a.p1;
  const { x: x2, y: y2 } = a.p2;
  const { x: x3, y: y3 } = b.p1;
  const { x: x4, y: y4 } = b.p2;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null;
  const px =
    ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
    denom;
  const py =
    ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
    denom;
  const point = { x: px, y: py };
  return pointNearSegment(point, a, 34) && pointNearSegment(point, b, 34) ? point : null;
}

function getOrCreatePoint(points: GeometryScenePoint[], point: Point): string {
  const existing = points.find((p) => dist(p, point) <= 24);
  if (existing) return existing.id;
  const id = POINT_IDS[points.length] ?? `P${points.length + 1}`;
  points.push({ id, x: Math.round(point.x), y: Math.round(point.y) });
  return id;
}

function buildAngles(
  points: GeometryScenePoint[],
  segments: GeometrySceneSegment[],
  angleMarkStrokes: Stroke[]
): GeometrySceneAngle[] {
  const angles: GeometrySceneAngle[] = [];
  for (const point of points) {
    const attached = segments.filter((s) => s.p1 === point.id || s.p2 === point.id);
    for (let i = 0; i < attached.length; i += 1) {
      for (let j = i + 1; j < attached.length; j += 1) {
        const hasMark = angleMarkStrokes.some((stroke) => {
          const pts = strokePoints(stroke);
          return pts.length > 0 && dist(centerOf(pts), point) < 80;
        });
        angles.push({
          id: `angle-${point.id}-${attached[i].id}-${attached[j].id}`,
          vertex: point.id,
          ray1: attached[i].id,
          ray2: attached[j].id,
          isMarked: hasMark,
        });
      }
    }
  }
  return angles;
}

function sharesVertex(a: GeometrySceneSegment, b: GeometrySceneSegment): boolean {
  return a.p1 === b.p1 || a.p1 === b.p2 || a.p2 === b.p1 || a.p2 === b.p2;
}

function buildRelations(segments: GeometrySceneSegment[]): GeometrySceneRelation[] {
  const relations: GeometrySceneRelation[] = [];
  const closedPolygon = segments.length >= 3 && segments.every((segment) =>
    segments.filter((other) => other.id !== segment.id && sharesVertex(segment, other)).length >= 1
  );

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (sharesVertex(a, b)) continue;

      if (angleDiff(a.angleDeg, b.angleDeg) <= 8) {
        relations.push({ type: 'parallel', targetIds: [a.id, b.id], confidence: 0.82 });
      }

      const longer = Math.max(a.length, b.length, 1);
      if (Math.abs(a.length - b.length) / longer <= 0.1) {
        relations.push({ type: 'equalLength', targetIds: [a.id, b.id], confidence: 0.58 });
      }
    }
  }

  if (closedPolygon && segments.length === 3) {
    return relations.filter((relation) => relation.type !== 'parallel');
  }

  return relations;
}

function attachLabels(
  labelText: string,
  points: GeometryScenePoint[],
  angles: GeometrySceneAngle[]
): GeometrySceneLabel[] {
  const sanitized = sanitizeGeometryLabel(labelText);
  if (!sanitized || !isUsefulGeometryLabel(sanitized)) return [];

  const tokens = sanitized.split(',').map((part) => part.trim()).filter(Boolean);
  return tokens.map((text, index) => {
    const point = points[index % Math.max(points.length, 1)];
    const angle = point ? angles.find((a) => a.vertex === point.id) : undefined;
    return {
      id: `ocr-label-${index + 1}`,
      text,
      x: point?.x ?? 0,
      y: point?.y ?? 0,
      targetId: angle?.id ?? point?.id,
      kind: /\d+\s*°/.test(text) ? 'angle' : /\d/.test(text) ? 'side' : 'unknown',
    };
  });
}

export function segmentGeometryStrokes(strokes: Stroke[]): SegmentedGeometryStrokes {
  const segmented: SegmentedGeometryStrokes = {
    lineStrokes: [],
    labelStrokes: [],
    angleMarkStrokes: [],
    relationMarkStrokes: [],
  };

  for (const stroke of strokes) {
    const bucket = classifyStroke(stroke);
    if (bucket !== 'ignore') segmented[bucket].push(stroke);
  }

  return segmented;
}

export function buildGeometryScene(strokes: Stroke[], recognizedLabelText = ''): GeometryScene {
  const segmented = segmentGeometryStrokes(strokes);
  const candidates = segmented.lineStrokes.map(segmentFromStroke).filter((s): s is SegmentCandidate => Boolean(s));
  const points: GeometryScenePoint[] = [];

  for (const candidate of candidates) {
    getOrCreatePoint(points, candidate.p1);
    getOrCreatePoint(points, candidate.p2);
  }

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const intersection = lineIntersection(candidates[i], candidates[j]);
      if (intersection) getOrCreatePoint(points, intersection);
    }
  }

  const segments = candidates.map<GeometrySceneSegment>((candidate, index) => ({
    id: `seg-${index + 1}`,
    strokeId: candidate.strokeId,
    p1: getOrCreatePoint(points, candidate.p1),
    p2: getOrCreatePoint(points, candidate.p2),
    length: Math.round(candidate.length * 100) / 100,
    angleDeg: Math.round(candidate.angleDeg * 100) / 100,
    kind: candidate.length > 250 ? 'line' : 'side',
  }));

  const angles = buildAngles(points, segments, segmented.angleMarkStrokes);
  const labels = attachLabels(recognizedLabelText, points, angles);
  const relations = buildRelations(segments);

  for (const label of labels) {
    if (label.kind !== 'angle') continue;
    const angle = angles.find((a) => a.id === label.targetId);
    const value = Number(label.text.match(/\d+(?:\.\d+)?/)?.[0]);
    if (angle && Number.isFinite(value)) {
      angle.valueDeg = value;
      angle.label = `${value}°`;
      relations.push({ type: 'knownAngle', targetIds: [angle.id], value, confidence: 0.72 });
    }
  }

  for (const angle of angles.filter((a) => a.isMarked && a.valueDeg === undefined)) {
    relations.push({ type: 'unknownAngle', targetIds: [angle.id], value: 'x', confidence: 0.68 });
  }

  return {
    points,
    segments,
    angles,
    labels,
    relations,
    bounds: strokes.length ? bounds(strokes.flatMap(strokePoints)) : undefined,
  };
}
