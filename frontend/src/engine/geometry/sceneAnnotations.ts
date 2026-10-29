import {
  GeometryScene,
  GeometrySceneAngle,
  GeometrySceneLabel,
  GeometryScenePoint,
  GeometrySceneSegment,
} from '../../types/geometry';
import type { Stroke } from '../../types/stroke';
import { segmentGeometryStrokes } from './sceneBuilder';
import { isUsefulGeometryLabel, sanitizeGeometryLabel, isAngleNameLabel } from './geometryLabelOcr';
import { isRightAngleMarkStroke, strokePoints as roleStrokePoints } from './strokeRoles';

interface Point {
  x: number;
  y: number;
}

export interface LabelStrokeRecognition {
  strokeId: string;
  text: string;
  confidence: number;
  centroid: Point;
  source?: 'ocr' | 'digit-guess';
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function strokePoints(stroke: Stroke): Point[] {
  if (stroke.points.length >= 2) return stroke.points.map((p) => ({ x: p.x, y: p.y }));
  return [];
}

function centroidOf(stroke: Stroke): Point | null {
  const points = strokePoints(stroke);
  if (points.length === 0) return null;
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function segmentEndpoints(
  scene: GeometryScene,
  segment: GeometrySceneSegment
): { p1: Point; p2: Point } | null {
  const p1 = scene.points.find((p) => p.id === segment.p1);
  const p2 = scene.points.find((p) => p.id === segment.p2);
  if (!p1 || !p2) return null;
  return { p1, p2 };
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const span = dist(a, b) || 1;
  const dot =
    ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (span * span);
  const clamped = Math.max(0, Math.min(1, dot));
  const proj = { x: a.x + clamped * (b.x - a.x), y: a.y + clamped * (b.y - a.y) };
  return dist(point, proj);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function outwardLabelPoint(a: Point, b: Point, centroid: Point, offset = 28): Point {
  const mid = midpoint(a, b);
  const edge = { x: b.x - a.x, y: b.y - a.y };
  const len = Math.hypot(edge.x, edge.y) || 1;
  const normal = { x: -edge.y / len, y: edge.x / len };
  const toShape = { x: centroid.x - mid.x, y: centroid.y - mid.y };
  const sign = normal.x * toShape.x + normal.y * toShape.y >= 0 ? -1 : 1;
  return {
    x: mid.x + normal.x * offset * sign,
    y: mid.y + normal.y * offset * sign,
  };
}

function shapeCentroid(scene: GeometryScene): Point {
  const vertices =
    scene.shapes?.flatMap((shape) => shape.vertices) ??
    scene.points.map((p) => ({ x: p.x, y: p.y }));
  if (vertices.length === 0) return { x: 0, y: 0 };
  return {
    x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
    y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
  };
}

function nearestSegment(
  scene: GeometryScene,
  point: Point
): { segment: GeometrySceneSegment; distance: number } | null {
  let best: { segment: GeometrySceneSegment; distance: number } | null = null;
  for (const segment of scene.segments) {
    const endpoints = segmentEndpoints(scene, segment);
    if (!endpoints) continue;
    const distance = distanceToSegment(point, endpoints.p1, endpoints.p2);
    if (!best || distance < best.distance) {
      best = { segment, distance };
    }
  }
  return best;
}

function nearestVertex(scene: GeometryScene, point: Point): GeometryScenePoint | null {
  let best: GeometryScenePoint | null = null;
  let bestDist = Infinity;
  for (const vertex of scene.points) {
    const d = dist(point, vertex);
    if (d < bestDist) {
      bestDist = d;
      best = vertex;
    }
  }
  return bestDist <= 160 ? best : null;
}

export function attachLabelRecognitions(
  scene: GeometryScene,
  recognitions: LabelStrokeRecognition[]
): GeometryScene {
  if (recognitions.length === 0) return scene;

  const centroid = shapeCentroid(scene);
  const labels: GeometrySceneLabel[] = scene.labels.filter((label) => isUsefulGeometryLabel(label.text));
  const segments = scene.segments.map((segment) => ({ ...segment, label: undefined as string | undefined }));

  for (const recognition of recognitions) {
    if (recognition.source === 'digit-guess' && /^(0|1|7|8)$/.test(recognition.text.trim())) {
      continue;
    }

    let text = sanitizeGeometryLabel(recognition.text);
    const vertex = nearestVertex(scene, recognition.centroid);
    const rawIsTheta =
      isAngleNameLabel(recognition.text) ||
      isAngleNameLabel(text) ||
      /^(0|o)$/i.test(text) ||
      /^(0|o)$/i.test(recognition.text.trim());

    if (rawIsTheta && vertex) {
      const named = isAngleNameLabel(text) ? text : isAngleNameLabel(recognition.text) ? recognition.text.trim() : 'θ';
      labels.push({
        id: `label-${recognition.strokeId}`,
        text: named.toLowerCase() === 'theta' ? 'θ' : named,
        x: vertex.x + 16,
        y: vertex.y - 16,
        targetId: vertex.id,
        kind: 'angle',
      });
      continue;
    }

    if (rawIsTheta || isAngleNameLabel(text) || text === 'θ') continue;
    if (/^(0|o)$/i.test(text)) continue;
    if (!text || !isUsefulGeometryLabel(text)) continue;
    if (text === '0') continue;

    const isAngleValue = /°/.test(text) || isAngleNameLabel(text);
    if (isAngleValue && vertex) {
      labels.push({
        id: `label-${recognition.strokeId}`,
        text,
        x: vertex.x + 16,
        y: vertex.y - 16,
        targetId: vertex.id,
        kind: 'angle',
      });
      continue;
    }

    const nearest = nearestSegment(scene, recognition.centroid);
    if (nearest && nearest.distance <= 140) {
      const endpoints = segmentEndpoints(scene, nearest.segment)!;
      const labelPoint = outwardLabelPoint(endpoints.p1, endpoints.p2, centroid);
      const segmentIndex = segments.findIndex((s) => s.id === nearest.segment.id);
      if (segmentIndex >= 0 && !segments[segmentIndex].label) {
        segments[segmentIndex] = { ...segments[segmentIndex], label: text };
      }
      labels.push({
        id: `label-${recognition.strokeId}`,
        text,
        x: Math.round(labelPoint.x),
        y: Math.round(labelPoint.y),
        targetId: nearest.segment.id,
        kind: 'side',
      });
    } else {
      labels.push({
        id: `label-${recognition.strokeId}`,
        text,
        x: Math.round(recognition.centroid.x),
        y: Math.round(recognition.centroid.y),
        kind: 'note',
      });
    }
  }

  return { ...scene, labels, segments };
}

export function rebuildSceneAngles(
  scene: GeometryScene,
  angleMarkStrokes: Stroke[]
): GeometryScene {
  if (scene.segments.length < 2 && (scene.shapes?.length ?? 0) === 0) return scene;

  const rightMarks = angleMarkStrokes.filter((stroke) => isRightAngleMarkStroke(roleStrokePoints(stroke)));
  const arcMarks = angleMarkStrokes.filter((stroke) => !rightMarks.includes(stroke));

  const existingByVertex = new Map(scene.angles.map((angle) => [angle.vertex, angle]));
  const angles: GeometrySceneAngle[] = [];

  for (const point of scene.points) {
    const attached = scene.segments.filter((s) => s.p1 === point.id || s.p2 === point.id);
    const rightStroke = rightMarks.find((stroke) => {
      const c = centroidOf(stroke);
      return c && dist(c, point) < 140;
    });
    const arcStroke = arcMarks.find((stroke) => {
      const c = centroidOf(stroke);
      return c && dist(c, point) < 140;
    });
    const thetaLabel = scene.labels.find(
      (label) => label.kind === 'angle' && label.targetId === point.id && isAngleNameLabel(label.text)
    );
    const existing = existingByVertex.get(point.id);
    const mark: GeometrySceneAngle['mark'] | undefined = rightStroke
      ? 'right'
      : arcStroke || thetaLabel
        ? 'arc'
        : undefined;

    if (existing) {
      angles.push({
        ...existing,
        isMarked: Boolean(mark) || existing.isMarked,
        mark: mark ?? existing.mark,
        label: existing.label ?? thetaLabel?.text,
      });
      continue;
    }

    if (attached.length < 2) continue;
    for (let i = 0; i < attached.length; i += 1) {
      for (let j = i + 1; j < attached.length; j += 1) {
        angles.push({
          id: `angle-${point.id}-${attached[i].id}-${attached[j].id}`,
          vertex: point.id,
          ray1: attached[i].id,
          ray2: attached[j].id,
          isMarked: Boolean(mark),
          mark,
          label: thetaLabel?.text,
        });
      }
    }
  }

  const relations = scene.relations.filter(
    (r) => r.type !== 'unknownAngle' && r.type !== 'knownAngle'
  );

  for (const angle of angles.filter((a) => (a.mark === 'arc' || a.label) && a.valueDeg === undefined)) {
    relations.push({ type: 'unknownAngle', targetIds: [angle.id], value: angle.label ?? 'θ', confidence: 0.72 });
  }
  for (const angle of angles.filter((a) => a.mark === 'right' || (a.valueDeg !== undefined && Math.abs((a.valueDeg ?? 0) - 90) <= 8))) {
    if (angle.mark === 'right' || Math.abs((angle.valueDeg ?? 0) - 90) <= 8) {
      relations.push({ type: 'knownAngle', targetIds: [angle.id], value: 90, confidence: 0.9 });
    }
  }

  return { ...scene, angles, relations };
}

export function applySceneAnnotations(
  scene: GeometryScene,
  strokes: Stroke[],
  labelRecognitions: LabelStrokeRecognition[]
): GeometryScene {
  const segmented = segmentGeometryStrokes(strokes);
  let updated = attachLabelRecognitions(scene, labelRecognitions);
  updated = rebuildSceneAngles(updated, segmented.angleMarkStrokes);
  return updated;
}

export function labelRecognitionsFromStrokes(
  strokes: Stroke[],
  ocrTexts: Array<{ strokeId: string; text: string; confidence: number; source?: 'ocr' | 'digit-guess' }>
): LabelStrokeRecognition[] {
  const results: LabelStrokeRecognition[] = [];
  for (const stroke of strokes) {
    const centroid = centroidOf(stroke);
    const ocr = ocrTexts.find((item) => item.strokeId === stroke.id);
    if (!centroid || !ocr?.text.trim()) continue;
    results.push({
      strokeId: stroke.id,
      text: ocr.text.trim(),
      confidence: ocr.confidence,
      centroid,
      source: ocr.source ?? (ocr.confidence < 0.55 ? 'digit-guess' : 'ocr'),
    });
  }
  return results;
}

export function parseBatchLabelText(text: string, strokeCount: number): string[] {
  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);
  if (numbers.length >= strokeCount) return numbers.slice(0, strokeCount);
  if (numbers.length === 1 && strokeCount > 1 && numbers[0].length === strokeCount) {
    return numbers[0].split('');
  }
  return numbers;
}
