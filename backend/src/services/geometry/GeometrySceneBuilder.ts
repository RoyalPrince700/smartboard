import { GeometryScene, GeometrySceneAngle, GeometrySceneLabel, GeometryScenePoint, GeometrySceneRelation, GeometrySceneSegment } from '../../types/geometry';
import { Stroke } from '../../types/stroke';

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
  straightness: number;
}

interface SegmentedStrokes {
  lineStrokes: Stroke[];
  labelStrokes: Stroke[];
  angleMarkStrokes: Stroke[];
  relationMarkStrokes: Stroke[];
}

const POINT_IDS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angleDeg(a: Point, b: Point): number {
  const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return ((deg % 180) + 180) % 180;
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 180;
  return Math.min(diff, 180 - diff);
}

function strokePoints(stroke: Stroke): Point[] {
  if (stroke.points.length >= 2) return stroke.points.map((p) => ({ x: p.x, y: p.y }));
  if (stroke.shapeBounds) {
    return [
      { x: stroke.shapeBounds.x1, y: stroke.shapeBounds.y1 },
      { x: stroke.shapeBounds.x2, y: stroke.shapeBounds.y2 },
    ];
  }
  return [];
}

function bounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

function maxPerpendicularDistance(points: Point[], a: Point, b: Point): number {
  const span = dist(a, b) || 1;
  return points.reduce((max, point) => {
    const area = Math.abs((b.x - a.x) * (a.y - point.y) - (a.x - point.x) * (b.y - a.y));
    return Math.max(max, area / span);
  }, 0);
}

function classifyStroke(stroke: Stroke): 'line' | 'label' | 'angleMark' | 'relationMark' | 'ignore' {
  if (stroke.tool === 'text') return 'label';
  if (stroke.tool === 'shape') return 'line';
  if (stroke.tool !== 'pen' && stroke.tool !== 'highlighter') return 'ignore';

  const points = strokePoints(stroke);
  if (points.length < 2) return 'ignore';

  const b = bounds(points);
  const width = Math.abs(b.x2 - b.x1);
  const height = Math.abs(b.y2 - b.y1);
  const maxDim = Math.max(width, height);
  const length = dist(points[0], points[points.length - 1]);
  const deviation = maxPerpendicularDistance(points, points[0], points[points.length - 1]);
  const straightEnough = deviation <= Math.max(8, length * 0.08);

  if (maxDim < 26) return 'relationMark';
  if (maxDim < 82 && !straightEnough) return 'angleMark';
  if (maxDim < 70 && points.length < 48) return 'label';
  if (straightEnough && length > 36) return 'line';
  return 'ignore';
}

function segmentFromStroke(stroke: Stroke): SegmentCandidate | null {
  const points = strokePoints(stroke);
  if (points.length < 2) return null;

  const p1 = points[0];
  const p2 = points[points.length - 1];
  const length = dist(p1, p2);
  if (length < 30) return null;

  const deviation = maxPerpendicularDistance(points, p1, p2);
  return {
    strokeId: stroke.id,
    p1,
    p2,
    length,
    angleDeg: angleDeg(p1, p2),
    straightness: 1 - Math.min(deviation / Math.max(length, 1), 1),
  };
}

function lineIntersection(a: SegmentCandidate, b: SegmentCandidate): Point | null {
  const x1 = a.p1.x;
  const y1 = a.p1.y;
  const x2 = a.p2.x;
  const y2 = a.p2.y;
  const x3 = b.p1.x;
  const y3 = b.p1.y;
  const x4 = b.p2.x;
  const y4 = b.p2.y;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null;
  const px =
    ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
    denom;
  const py =
    ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
    denom;
  if (!pointNearSegment({ x: px, y: py }, a, 34) || !pointNearSegment({ x: px, y: py }, b, 34)) {
    return null;
  }
  return { x: px, y: py };
}

function pointNearSegment(point: Point, segment: SegmentCandidate, tolerance: number): boolean {
  const minX = Math.min(segment.p1.x, segment.p2.x) - tolerance;
  const maxX = Math.max(segment.p1.x, segment.p2.x) + tolerance;
  const minY = Math.min(segment.p1.y, segment.p2.y) - tolerance;
  const maxY = Math.max(segment.p1.y, segment.p2.y) + tolerance;
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

function getOrCreatePoint(points: GeometryScenePoint[], point: Point): string {
  const existing = points.find((p) => dist(p, point) <= 24);
  if (existing) return existing.id;
  const id = POINT_IDS[points.length] ?? `P${points.length + 1}`;
  points.push({ id, x: Math.round(point.x), y: Math.round(point.y) });
  return id;
}

function nearestPoint(points: GeometryScenePoint[], point: Point): GeometryScenePoint | undefined {
  return [...points].sort((a, b) => dist(a, point) - dist(b, point))[0];
}

function buildAngles(
  points: GeometryScenePoint[],
  segments: GeometrySceneSegment[],
  angleMarkStrokes: Stroke[]
): GeometrySceneAngle[] {
  const angles: GeometrySceneAngle[] = [];
  for (const point of points) {
    const attached = segments.filter((s) => s.p1 === point.id || s.p2 === point.id);
    if (attached.length < 2) continue;
    for (let i = 0; i < attached.length; i += 1) {
      for (let j = i + 1; j < attached.length; j += 1) {
        const hasMark = angleMarkStrokes.some((stroke) => {
          const pts = strokePoints(stroke);
          if (!pts.length) return false;
          const center = centerOf(pts);
          return dist(center, point) < 80;
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

function centerOf(points: Point[]): Point {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function buildRelations(segments: GeometrySceneSegment[], candidates: SegmentCandidate[]): GeometrySceneRelation[] {
  const relations: GeometrySceneRelation[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (angleDiff(segments[i].angleDeg, segments[j].angleDeg) <= 7) {
        relations.push({
          type: 'parallel',
          targetIds: [segments[i].id, segments[j].id],
          confidence: 0.82,
        });
      }
      const lengthA = candidates[i]?.length ?? segments[i].length;
      const lengthB = candidates[j]?.length ?? segments[j].length;
      if (Math.abs(lengthA - lengthB) / Math.max(lengthA, lengthB, 1) <= 0.12) {
        relations.push({
          type: 'equalLength',
          targetIds: [segments[i].id, segments[j].id],
          confidence: 0.58,
        });
      }
    }
  }
  return relations;
}

function buildLabels(
  textStrokes: Stroke[],
  points: GeometryScenePoint[],
  angles: GeometrySceneAngle[]
): GeometrySceneLabel[] {
  return textStrokes
    .filter((stroke) => stroke.textContent?.trim() && stroke.shapeBounds)
    .map((stroke, index) => {
      const b = stroke.shapeBounds!;
      const center = { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 };
      const point = nearestPoint(points, center);
      const angle = point ? angles.find((a) => a.vertex === point.id) : undefined;
      return {
        id: `label-${index + 1}`,
        text: stroke.textContent!.trim(),
        x: Math.round(center.x),
        y: Math.round(center.y),
        targetId: angle?.id ?? point?.id,
        kind: /\d+\s*°?/.test(stroke.textContent ?? '') ? 'angle' : 'note',
      };
    });
}

export class GeometrySceneBuilder {
  segmentStrokes(strokes: Stroke[]): SegmentedStrokes {
    const segmented: SegmentedStrokes = {
      lineStrokes: [],
      labelStrokes: [],
      angleMarkStrokes: [],
      relationMarkStrokes: [],
    };

    for (const stroke of strokes) {
      const classification = classifyStroke(stroke);
      if (classification === 'line') segmented.lineStrokes.push(stroke);
      else if (classification === 'label') segmented.labelStrokes.push(stroke);
      else if (classification === 'angleMark') segmented.angleMarkStrokes.push(stroke);
      else if (classification === 'relationMark') segmented.relationMarkStrokes.push(stroke);
    }

    return segmented;
  }

  build(strokes: Stroke[], recognizedLabels: string[] = []): GeometryScene {
    const segmented = this.segmentStrokes(strokes);
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

    const segments: GeometrySceneSegment[] = candidates.map((candidate, index) => ({
      id: `seg-${index + 1}`,
      strokeId: candidate.strokeId,
      p1: getOrCreatePoint(points, candidate.p1),
      p2: getOrCreatePoint(points, candidate.p2),
      length: Math.round(candidate.length * 100) / 100,
      angleDeg: Math.round(candidate.angleDeg * 100) / 100,
      kind: candidate.length > 250 ? 'line' : 'side',
    }));

    const angles = buildAngles(points, segments, segmented.angleMarkStrokes);
    const labels = buildLabels(segmented.labelStrokes, points, angles);
    const ocrLabels = this.labelsFromOcr(recognizedLabels, points, angles);
    const relations = buildRelations(segments, candidates);

    for (const label of [...labels, ...ocrLabels]) {
      if (label.kind !== 'angle') continue;
      const angle = angles.find((a) => a.id === label.targetId);
      const value = Number(label.text.match(/\d+(?:\.\d+)?/)?.[0]);
      if (angle && Number.isFinite(value)) {
        angle.valueDeg = value;
        angle.label = `${value}°`;
        relations.push({ type: 'knownAngle', targetIds: [angle.id], value, confidence: 0.75 });
      }
    }

    for (const angle of angles.filter((a) => a.isMarked && a.valueDeg === undefined)) {
      relations.push({ type: 'unknownAngle', targetIds: [angle.id], value: 'x', confidence: 0.7 });
    }

    return {
      points,
      segments,
      angles,
      labels: [...labels, ...ocrLabels],
      relations,
      bounds: strokes.length ? bounds(strokes.flatMap(strokePoints)) : undefined,
    };
  }

  private labelsFromOcr(
    recognizedLabels: string[],
    points: GeometryScenePoint[],
    angles: GeometrySceneAngle[]
  ): GeometrySceneLabel[] {
    return recognizedLabels.flatMap((labelText, index) =>
      [...labelText.matchAll(/[a-zA-Z]|\d+(?:\.\d+)?\s*°?/g)].map((match, partIndex) => {
        const point = points[index % Math.max(points.length, 1)];
        const angle = point ? angles.find((a) => a.vertex === point.id) : undefined;
        const text = match[0].trim();
        return {
          id: `ocr-label-${index + 1}-${partIndex + 1}`,
          text,
          x: point?.x ?? 0,
          y: point?.y ?? 0,
          targetId: angle?.id ?? point?.id,
          kind: /\d/.test(text) ? 'angle' : 'unknown',
        };
      })
    );
  }
}

export const geometrySceneBuilder = new GeometrySceneBuilder();
