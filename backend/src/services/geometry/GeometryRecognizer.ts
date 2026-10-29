import { ShapeBounds, Stroke } from '../../types/stroke';
import {
  RecognizedShape,
  RecognizedShapeType,
  ShapeMeasurement,
} from '../../types/geometry';

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function formatNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function getBounds(points: Point[]): ShapeBounds {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

function boundsSize(bounds: ShapeBounds): { width: number; height: number; maxDim: number } {
  const width = Math.abs(bounds.x2 - bounds.x1);
  const height = Math.abs(bounds.y2 - bounds.y1);
  return { width, height, maxDim: Math.max(width, height) };
}

function strokePoints(stroke: Stroke): Point[] {
  if (stroke.points.length >= 2) return stroke.points.map((p) => ({ x: p.x, y: p.y }));
  if (stroke.shapeBounds) {
    const b = stroke.shapeBounds;
    return [
      { x: b.x1, y: b.y1 },
      { x: b.x2, y: b.y2 },
    ];
  }
  return [];
}

function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  const span = dist(start, end) || 1;

  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], start, end, span);
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

function perpendicularDistance(point: Point, start: Point, end: Point, span: number): number {
  const area = Math.abs(
    (end.x - start.x) * (start.y - point.y) - (start.x - point.x) * (end.y - start.y)
  );
  return area / span;
}

function clusterNearbyPoints(points: Point[], threshold: number): Point[] {
  const clusters: Point[][] = [];

  for (const point of points) {
    const existing = clusters.find((cluster) =>
      cluster.some((member) => dist(member, point) <= threshold)
    );
    if (existing) existing.push(point);
    else clusters.push([point]);
  }

  return clusters.map((cluster) => ({
    x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
    y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length,
  }));
}

function isClosedPath(points: Point[], threshold: number): boolean {
  if (points.length < 4) return false;
  return dist(points[0], points[points.length - 1]) <= threshold;
}

function circularityScore(points: Point[], bounds: ShapeBounds): number {
  const { width, height } = boundsSize(bounds);
  const cx = (bounds.x1 + bounds.x2) / 2;
  const cy = (bounds.y1 + bounds.y2) / 2;
  const avgRadius =
    points.reduce((sum, p) => sum + dist(p, { x: cx, y: cy }), 0) / points.length;
  if (avgRadius <= 0) return 1;
  const variance =
    points.reduce((sum, p) => sum + (dist(p, { x: cx, y: cy }) - avgRadius) ** 2, 0) /
    points.length;
  const radial = Math.sqrt(variance) / avgRadius;
  const aspectPenalty = Math.abs(width - height) / Math.max(width, height, 1);
  return radial + aspectPenalty * 0.5;
}

function almostEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

function classifyFromVertices(
  vertices: Point[],
  points: Point[],
  bounds: ShapeBounds
): { type: RecognizedShapeType; confidence: number } {
  const { width, height, maxDim } = boundsSize(bounds);
  const closed = isClosedPath(points, Math.max(28, maxDim * 0.18));
  const circularity = circularityScore(points, bounds);

  if (closed && circularity < 0.28 && vertices.length >= 5) {
    return { type: 'circle', confidence: circularity < 0.18 ? 0.86 : 0.72 };
  }

  if (vertices.length <= 2 || (!closed && (width > height * 3.2 || height > width * 3.2))) {
    return { type: 'line', confidence: 0.7 };
  }

  if (vertices.length === 3) {
    return { type: 'triangle', confidence: closed ? 0.84 : 0.76 };
  }

  if (vertices.length === 4) {
    const sides = [
      dist(vertices[0], vertices[1]),
      dist(vertices[1], vertices[2]),
      dist(vertices[2], vertices[3]),
      dist(vertices[3], vertices[0]),
    ];
    const oppositeSimilar =
      almostEqual(sides[0], sides[2], Math.max(sides[0], sides[2]) * 0.2) &&
      almostEqual(sides[1], sides[3], Math.max(sides[1], sides[3]) * 0.2);
    return {
      type: oppositeSimilar ? 'rectangle' : 'polygon',
      confidence: oppositeSimilar ? 0.8 : 0.62,
    };
  }

  if (closed && vertices.length >= 5) {
    return { type: circularity < 0.35 ? 'circle' : 'polygon', confidence: 0.6 };
  }

  return { type: 'freehand', confidence: 0.4 };
}

function measurementsFor(
  type: RecognizedShapeType,
  bounds: ShapeBounds,
  vertices: Point[]
): ShapeMeasurement[] {
  const { width, height } = boundsSize(bounds);

  switch (type) {
    case 'line': {
      const length =
        vertices.length >= 2 ? dist(vertices[0], vertices[vertices.length - 1]) : Math.hypot(width, height);
      return [{ name: 'Length', value: `${formatNum(length)} px`, numericValue: length }];
    }
    case 'rectangle': {
      const area = width * height;
      const perimeter = 2 * (width + height);
      return [
        { name: 'Width', value: `${formatNum(width)} px`, numericValue: width },
        { name: 'Height', value: `${formatNum(height)} px`, numericValue: height },
        { name: 'Area', value: `${formatNum(area)} px²`, numericValue: area },
        { name: 'Perimeter', value: `${formatNum(perimeter)} px`, numericValue: perimeter },
      ];
    }
    case 'circle': {
      const radius = (width + height) / 4;
      return [
        { name: 'Approx. radius', value: `${formatNum(radius)} px`, numericValue: radius },
        { name: 'Approx. area', value: `${formatNum(Math.PI * radius * radius)} px²` },
      ];
    }
    case 'triangle': {
      const sides =
        vertices.length >= 3
          ? [
              dist(vertices[0], vertices[1]),
              dist(vertices[1], vertices[2]),
              dist(vertices[2], vertices[0]),
            ]
          : [];
      return sides.map((side, index) => ({
        name: `Side ${index + 1}`,
        value: `${formatNum(side)} px`,
        numericValue: side,
      }));
    }
    default:
      return [];
  }
}

function analyzeShapeStroke(stroke: Stroke): RecognizedShape | null {
  if (stroke.tool !== 'shape' || !stroke.shapeBounds || !stroke.shapeType) {
    return null;
  }

  const type = stroke.shapeType as RecognizedShapeType;
  const bounds = stroke.shapeBounds;
  const vertices: Point[] = [
    { x: bounds.x1, y: bounds.y1 },
    { x: bounds.x2, y: bounds.y1 },
    { x: bounds.x2, y: bounds.y2 },
    { x: bounds.x1, y: bounds.y2 },
  ];

  return {
    id: `shape-${stroke.id}`,
    strokeId: stroke.id,
    type,
    shapeType: stroke.shapeType,
    bounds,
    measurements: measurementsFor(type, bounds, vertices),
    labels: [],
    confidence: 0.95,
  };
}

function isLikelyLabelStroke(stroke: Stroke): boolean {
  if (stroke.tool === 'text') return true;
  if (stroke.tool !== 'pen' && stroke.tool !== 'highlighter') return false;
  const points = strokePoints(stroke);
  if (points.length < 2) return false;
  const { maxDim } = boundsSize(getBounds(points));
  return maxDim < 70 && points.length < 48;
}

function clusterPenStrokes(strokes: Stroke[]): Stroke[][] {
  const parent = strokes.map((_, i) => i);

  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  const ends = strokes.map((stroke) => {
    const points = strokePoints(stroke);
    return { start: points[0], end: points[points.length - 1] };
  });

  for (let i = 0; i < strokes.length; i += 1) {
    for (let j = i + 1; j < strokes.length; j += 1) {
      const a = ends[i];
      const b = ends[j];
      const threshold = 42;
      if (
        dist(a.start, b.start) < threshold ||
        dist(a.start, b.end) < threshold ||
        dist(a.end, b.start) < threshold ||
        dist(a.end, b.end) < threshold
      ) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, Stroke[]>();
  strokes.forEach((stroke, i) => {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(stroke);
    groups.set(root, list);
  });

  return [...groups.values()];
}

function analyzeStrokeCluster(strokes: Stroke[]): RecognizedShape | null {
  const points = strokes.flatMap(strokePoints);
  if (points.length < 4) return null;

  const bounds = getBounds(points);
  const { width, height, maxDim } = boundsSize(bounds);
  if (width < 18 && height < 18) return null;

  const cornerCandidates = strokes.flatMap((stroke) => {
    const strokePts = strokePoints(stroke);
    return ramerDouglasPeucker(strokePts, Math.max(10, maxDim * 0.045));
  });
  const vertices = clusterNearbyPoints(cornerCandidates, Math.max(22, maxDim * 0.08));
  const { type, confidence } = classifyFromVertices(vertices, points, bounds);

  return {
    id: `freehand-${strokes.map((s) => s.id).join('-')}`,
    strokeId: strokes[0].id,
    type,
    bounds,
    measurements: measurementsFor(type, bounds, vertices),
    labels: [],
    confidence,
  };
}

function extractTextAnnotations(strokes: Stroke[]): string[] {
  return strokes
    .filter((s) => s.tool === 'text' && s.textContent)
    .map((s) => s.textContent!.trim())
    .filter(Boolean);
}

function parseMeasurementFromText(text: string): ShapeMeasurement[] {
  const results: ShapeMeasurement[] = [];
  const patterns = [
    /([A-Z]{2})\s*=\s*([\d.]+)\s*(cm|m|mm|°|deg)?/gi,
    /angle\s*([A-Z])\s*=\s*([\d.]+)\s*°?/gi,
    /([\d.]+)\s*(cm|m|mm)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      results.push({
        name: match[1] ?? 'Measurement',
        value: `${match[2] ?? match[1]}${match[3] ?? ''}`.trim(),
        numericValue: Number(match[2] ?? match[1]),
      });
    }
  }

  return results;
}

function associateLabelsWithShapes(shapes: RecognizedShape[], textStrokes: Stroke[]): void {
  for (const shape of shapes) {
    if (!shape.bounds) continue;
    const cx = (shape.bounds.x1 + shape.bounds.x2) / 2;
    const cy = (shape.bounds.y1 + shape.bounds.y2) / 2;

    for (const textStroke of textStrokes) {
      if (!textStroke.shapeBounds || !textStroke.textContent) continue;
      const tx = (textStroke.shapeBounds.x1 + textStroke.shapeBounds.x2) / 2;
      const ty = (textStroke.shapeBounds.y1 + textStroke.shapeBounds.y2) / 2;
      if (dist({ x: cx, y: cy }, { x: tx, y: ty }) < 140) {
        shape.labels.push(textStroke.textContent);
      }
    }
  }
}

export class GeometryRecognizer {
  recognize(strokes: Stroke[]): RecognizedShape[] {
    const shapes: RecognizedShape[] = [];
    const remaining: Stroke[] = [];

    for (const stroke of strokes) {
      const fromTool = analyzeShapeStroke(stroke);
      if (fromTool) {
        shapes.push(fromTool);
        continue;
      }
      if ((stroke.tool === 'pen' || stroke.tool === 'highlighter') && !isLikelyLabelStroke(stroke)) {
        remaining.push(stroke);
      }
    }

    for (const cluster of clusterPenStrokes(remaining)) {
      const recognized = analyzeStrokeCluster(cluster);
      if (recognized) shapes.push(recognized);
    }

    const textStrokes = strokes.filter((s) => s.tool === 'text');
    associateLabelsWithShapes(shapes, textStrokes);

    return shapes;
  }

  extractAnnotations(strokes: Stroke[]): {
    textAnnotations: string[];
    parsedMeasurements: ShapeMeasurement[];
  } {
    const textAnnotations = extractTextAnnotations(strokes);
    const parsedMeasurements = textAnnotations.flatMap(parseMeasurementFromText);
    return { textAnnotations, parsedMeasurements };
  }

  splitShapeAndLabelStrokes(strokes: Stroke[]): { shapeStrokes: Stroke[]; labelStrokes: Stroke[] } {
    const shapeStrokes: Stroke[] = [];
    const labelStrokes: Stroke[] = [];

    for (const stroke of strokes) {
      if (stroke.tool === 'shape') {
        shapeStrokes.push(stroke);
        continue;
      }
      if (stroke.tool === 'text' || isLikelyLabelStroke(stroke)) {
        labelStrokes.push(stroke);
        continue;
      }
      if (stroke.tool === 'pen' || stroke.tool === 'highlighter') {
        shapeStrokes.push(stroke);
      }
    }

    return { shapeStrokes, labelStrokes };
  }
}

export const geometryRecognizer = new GeometryRecognizer();
