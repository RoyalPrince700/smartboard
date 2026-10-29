import type { GeometryObject, Point, RecognitionResult } from '../types/whiteboardGeometry';
import {
  boundingBox,
  dist,
  pathLength,
  pointToLineDistance,
  ramerDouglasPeucker,
  wrapDelta,
} from './geometryMath';
import { DEFAULT_RECOGNITION_CONFIG, type RecognitionConfig } from './recognitionConfig';
import { recognizeTriangle } from './triangleRecognition';

export type { RecognitionConfig } from './recognitionConfig';
export { DEFAULT_RECOGNITION_CONFIG } from './recognitionConfig';

export const PREFERRED_ANGLES_DEG = [
  0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
] as const;

export interface CircleFit {
  center: Point;
  radius: number;
  meanRadialError: number;
  maxRadialError: number;
}

/** Algebraic least-squares circle fit (Kåsa method). */
export function fitCircle(points: Point[]): CircleFit | null {
  if (points.length < 3) return null;

  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let sumXY = 0;
  let sumX3 = 0;
  let sumY3 = 0;
  let sumXY2 = 0;
  let sumX2Y = 0;
  const n = points.length;

  for (const p of points) {
    const x = p.x;
    const y = p.y;
    const x2 = x * x;
    const y2 = y * y;
    sumX += x;
    sumY += y;
    sumX2 += x2;
    sumY2 += y2;
    sumXY += x * y;
    sumX3 += x2 * x;
    sumY3 += y2 * y;
    sumXY2 += x * y2;
    sumX2Y += x2 * y;
  }

  const A = n * sumX2 - sumX * sumX;
  const B = n * sumXY - sumX * sumY;
  const C = n * sumY2 - sumY * sumY;
  const D = 0.5 * (n * sumX3 + n * sumXY2 - sumX * (sumX2 + sumY2));
  const E = 0.5 * (n * sumX2Y + n * sumY3 - sumY * (sumX2 + sumY2));
  const denom = A * C - B * B;

  if (Math.abs(denom) < 1e-8) return null;

  const cx = (D * C - B * E) / denom;
  const cy = (A * E - B * D) / denom;

  let radiusSum = 0;
  let errorSum = 0;
  let maxError = 0;

  for (const p of points) {
    radiusSum += Math.hypot(p.x - cx, p.y - cy);
  }

  const radius = radiusSum / n;

  for (const p of points) {
    const err = Math.abs(Math.hypot(p.x - cx, p.y - cy) - radius);
    errorSum += err;
    maxError = Math.max(maxError, err);
  }

  return {
    center: { x: cx, y: cy },
    radius,
    meanRadialError: errorSum / n,
    maxRadialError: maxError,
  };
}

function computeAngularCoverage(points: Point[], center: Point): number {
  const angles = points.map((p) => Math.atan2(p.y - center.y, p.x - center.x));
  angles.sort((a, b) => a - b);

  let maxGap = 0;
  for (let i = 0; i < angles.length; i += 1) {
    const current = angles[i];
    const next = i === angles.length - 1 ? angles[0] + Math.PI * 2 : angles[i + 1];
    maxGap = Math.max(maxGap, next - current);
  }

  return Math.PI * 2 - maxGap;
}

function computeArcSpan(points: Point[], center: Point): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a0 = Math.atan2(points[i - 1].y - center.y, points[i - 1].x - center.x);
    const a1 = Math.atan2(points[i].y - center.y, points[i].x - center.x);
    total += Math.abs(wrapDelta(a1 - a0));
  }
  return total;
}

function determineArcSweep(
  center: Point,
  points: Point[]
): { startAngle: number; endAngle: number; clockwise: boolean } {
  const startAngle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  const endAngle = Math.atan2(
    points[points.length - 1].y - center.y,
    points[points.length - 1].x - center.x
  );

  let ccw = 0;
  let cw = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a0 = Math.atan2(points[i - 1].y - center.y, points[i - 1].x - center.x);
    const a1 = Math.atan2(points[i].y - center.y, points[i].x - center.x);
    const delta = wrapDelta(a1 - a0);
    if (delta >= 0) ccw += delta;
    else cw += -delta;
  }

  return {
    startAngle,
    endAngle,
    clockwise: cw > ccw,
  };
}

function normalizeAngle180(degrees: number): number {
  return ((degrees % 180) + 180) % 180;
}

function angularDistanceDeg(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 180 - diff);
}

export function calculateLineAngle(start: Point, end: Point): number {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

interface AngleSnapResult {
  angleDeg: number;
  snapStrength: number;
}

export function snapLineAngle(angleDeg: number, config: RecognitionConfig): AngleSnapResult {
  const normalized = normalizeAngle180(angleDeg);

  let bestAngle = normalized;
  let bestDiff = Infinity;

  for (const preferred of PREFERRED_ANGLES_DEG) {
    const diff = angularDistanceDeg(normalized, preferred);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAngle = preferred;
    }
  }

  if (bestDiff <= config.strongAngleSnapToleranceDeg) {
    return { angleDeg: bestAngle, snapStrength: 1 };
  }

  if (bestDiff <= config.weakAngleSnapToleranceDeg) {
    return { angleDeg: bestAngle, snapStrength: 0.75 };
  }

  return { angleDeg: normalized, snapStrength: 0 };
}

export function recognizeLine(
  points: Point[],
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): RecognitionResult | null {
  if (points.length < config.minPointsLine) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const length = dist(start, end);

  if (length < config.minLineLength) return null;

  let maxDeviation = 0;
  for (const point of points) {
    maxDeviation = Math.max(maxDeviation, pointToLineDistance(point, start, end));
  }

  const deviationRatio = maxDeviation / length;
  if (deviationRatio > config.lineMaxDeviationRatio) return null;

  const rawAngleRad = calculateLineAngle(start, end);
  const rawAngleDeg = (rawAngleRad * 180) / Math.PI;
  const snap = snapLineAngle(rawAngleDeg, config);

  const candidateA = (snap.angleDeg * Math.PI) / 180;
  const candidateB = candidateA + Math.PI;
  const angularDiff = (a: number, b: number) => {
    let diff = Math.abs(a - b);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
    return diff;
  };
  const finalAngleRad =
    angularDiff(candidateA, rawAngleRad) <= angularDiff(candidateB, rawAngleRad)
      ? candidateA
      : candidateB;

  const cleanEnd = {
    x: start.x + Math.cos(finalAngleRad) * length,
    y: start.y + Math.sin(finalAngleRad) * length,
  };

  const straightness = 1 - deviationRatio / config.lineMaxDeviationRatio;
  const confidence = Math.min(1, straightness * (0.85 + snap.snapStrength * 0.15));

  if (confidence < config.minLineConfidence) return null;

  return {
    geometry: {
      type: 'line',
      start: { ...start },
      end: cleanEnd,
      angle: finalAngleRad,
      confidence,
    },
    confidence,
  };
}

export function recognizeCircle(
  points: Point[],
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): RecognitionResult | null {
  if (points.length < config.minPointsCircle) return null;

  const fit = fitCircle(points);
  if (!fit || fit.radius < config.minCircleRadius) return null;

  const radialErrorRatio = fit.meanRadialError / fit.radius;
  if (radialErrorRatio > config.circleMaxRadialErrorRatio) return null;

  const closureRatio = dist(points[0], points[points.length - 1]) / (fit.radius * 2);
  if (closureRatio > config.circleMaxClosureRatio) return null;

  const coverage = computeAngularCoverage(points, fit.center);
  if (coverage < config.circleMinCoverageRadians) return null;

  const coverageScore = Math.min(1, coverage / (Math.PI * 2));
  const radialScore = 1 - radialErrorRatio / config.circleMaxRadialErrorRatio;
  const closureScore = 1 - closureRatio / config.circleMaxClosureRatio;
  const pointScore = Math.min(1, points.length / 24);

  const confidence =
    coverageScore * 0.35 + radialScore * 0.4 + closureScore * 0.15 + pointScore * 0.1;

  if (confidence < config.minCircleConfidence) return null;

  return {
    geometry: {
      type: 'circle',
      center: fit.center,
      radius: fit.radius,
      confidence,
    },
    confidence,
  };
}

export function recognizeArc(
  points: Point[],
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): RecognitionResult | null {
  if (points.length < config.minPointsArc) return null;

  const fit = fitCircle(points);
  if (!fit || fit.radius < config.minCircleRadius) return null;

  const radialErrorRatio = fit.meanRadialError / fit.radius;
  if (radialErrorRatio > config.arcMaxRadialErrorRatio) return null;

  const closureRatio = dist(points[0], points[points.length - 1]) / (fit.radius * 2);
  if (closureRatio < config.arcMinClosureRatio) return null;

  const span = computeArcSpan(points, fit.center);
  if (span < config.arcMinSpanRadians || span > config.arcMaxSpanRadians) return null;

  const coverage = computeAngularCoverage(points, fit.center);
  if (coverage > config.circleMinCoverageRadians && closureRatio <= config.circleMaxClosureRatio) {
    return null;
  }

  const sweep = determineArcSweep(fit.center, points);
  const radialScore = 1 - radialErrorRatio / config.arcMaxRadialErrorRatio;
  const spanScore = Math.min(1, span / Math.PI);
  const pointScore = Math.min(1, points.length / 16);
  const confidence = radialScore * 0.55 + spanScore * 0.3 + pointScore * 0.15;

  if (confidence < config.minArcConfidence) return null;

  return {
    geometry: {
      type: 'arc',
      center: fit.center,
      radius: fit.radius,
      startAngle: sweep.startAngle,
      endAngle: sweep.endAngle,
      clockwise: sweep.clockwise,
      confidence,
    },
    confidence,
  };
}

export function recognizeSemicircle(
  points: Point[],
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): RecognitionResult | null {
  if (points.length < config.minPointsArc) return null;

  const fit = fitCircle(points);
  if (!fit || fit.radius < config.minCircleRadius) return null;

  const radialErrorRatio = fit.meanRadialError / fit.radius;
  if (radialErrorRatio > config.arcMaxRadialErrorRatio) return null;

  const span = computeArcSpan(points, fit.center);
  const spanError = Math.abs(span - Math.PI);
  if (spanError > config.semicircleSpanToleranceRad) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const chord = dist(start, end);
  const chordRatio = chord / (fit.radius * 2);
  if (chordRatio < config.semicircleMinChordRatio || chordRatio > 1.25) return null;

  const sweep = determineArcSweep(fit.center, points);
  const startAngle = Math.atan2(start.y - fit.center.y, start.x - fit.center.x);
  const endAngle = startAngle + (sweep.clockwise ? -Math.PI : Math.PI);

  const radialScore = 1 - radialErrorRatio / config.arcMaxRadialErrorRatio;
  const spanScore = 1 - spanError / config.semicircleSpanToleranceRad;
  const chordScore = 1 - Math.min(1, Math.abs(chordRatio - 1) / 0.28);
  const confidence = radialScore * 0.4 + spanScore * 0.35 + chordScore * 0.25;

  if (confidence < config.minSemicircleConfidence) return null;

  return {
    geometry: {
      type: 'semicircle',
      center: fit.center,
      radius: fit.radius,
      startAngle,
      endAngle,
      clockwise: sweep.clockwise,
      confidence,
    },
    confidence,
  };
}

export function recognizeFreehand(points: Point[]): RecognitionResult {
  const bounds = boundingBox(points);
  const tolerance = Math.max(1.8, Math.min(6, bounds.diagonal * 0.012));
  const simplified =
    points.length > 2 ? ramerDouglasPeucker(points, tolerance) : points.map((p) => ({ ...p }));
  const confidence = 0.35;

  return {
    geometry: {
      type: 'freehand',
      points: simplified,
      confidence,
    },
    confidence,
  };
}

const TYPE_PRIORITY: Record<GeometryObject['type'], number> = {
  circle: 6,
  semicircle: 5,
  triangle: 4,
  arc: 3,
  line: 2,
  polygon: 1,
  freehand: 0,
};

function pickBest(candidates: RecognitionResult[]): RecognitionResult | null {
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const conf = b.confidence - a.confidence;
    if (Math.abs(conf) > 0.04) return conf;
    return TYPE_PRIORITY[b.geometry.type] - TYPE_PRIORITY[a.geometry.type];
  });

  return candidates[0];
}

export function recognizeGeometry(
  points: Point[],
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): RecognitionResult {
  if (points.length === 0) {
    return recognizeFreehand([]);
  }

  if (points.length === 1) {
    return {
      geometry: { type: 'freehand', points: [{ ...points[0] }], confidence: 0.4 },
      confidence: 0.4,
    };
  }

  if (pathLength(points) < 8) {
    return recognizeFreehand(points);
  }

  const candidates: RecognitionResult[] = [];

  const circle = recognizeCircle(points, config);
  if (circle) candidates.push(circle);

  const semicircle = recognizeSemicircle(points, config);
  if (semicircle) candidates.push(semicircle);

  const arc = recognizeArc(points, config);
  if (arc) candidates.push(arc);

  const triangle = recognizeTriangle(points, config);
  if (triangle) candidates.push(triangle);

  const line = recognizeLine(points, config);
  if (line) candidates.push(line);

  return pickBest(candidates) ?? recognizeFreehand(points);
}

export function calculateRecognitionConfidence(
  points: Point[],
  geometry: GeometryObject,
  config: RecognitionConfig = DEFAULT_RECOGNITION_CONFIG
): number {
  switch (geometry.type) {
    case 'line':
      return recognizeLine(points, config)?.confidence ?? 0;
    case 'circle':
      return recognizeCircle(points, config)?.confidence ?? 0;
    case 'semicircle':
      return recognizeSemicircle(points, config)?.confidence ?? 0;
    case 'arc':
      return recognizeArc(points, config)?.confidence ?? 0;
    case 'triangle':
      return recognizeTriangle(points, config)?.confidence ?? 0;
    default:
      return 0.35;
  }
}
