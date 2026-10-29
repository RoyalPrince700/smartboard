import type {
  Point,
  RecognitionResult,
  TriangleClassification,
  TriangleGeometry,
  VertexIndex,
} from '../types/whiteboardGeometry';
import type { RecognitionConfig } from './recognitionConfig';
import {
  asVertexIndex,
  boundingBox,
  centroid,
  clusterNearbyPoints,
  cross,
  dist,
  interiorAngle,
  midpoint,
  nearestIndex,
  normalize,
  pathLength,
  pointToInfiniteLineDistance,
  pointToLineDistance,
  ramerDouglasPeucker,
  relativeDifference,
  subtract,
  triangleArea,
} from './geometryMath';

export interface TriangleMetrics {
  vertices: [Point, Point, Point];
  sideLengths: [number, number, number];
  angles: [number, number, number];
  area: number;
}

export function computeTriangleMetrics(vertices: [Point, Point, Point]): TriangleMetrics {
  const [a, b, c] = vertices;
  const sideLengths: [number, number, number] = [dist(a, b), dist(b, c), dist(c, a)];
  const angles: [number, number, number] = [
    interiorAngle(a, c, b),
    interiorAngle(b, a, c),
    interiorAngle(c, b, a),
  ];
  return {
    vertices,
    sideLengths,
    angles,
    area: triangleArea(a, b, c),
  };
}

function sideDeviation(
  points: Point[],
  fromIndex: number,
  toIndex: number,
  closed: boolean
): number {
  const start = points[fromIndex];
  const end = points[toIndex];
  const n = points.length;
  if (n < 3) return 0;

  let maxDeviation = 0;
  let i = fromIndex;
  const guard = n + 2;

  for (let step = 0; step < guard; step += 1) {
    i = (i + 1) % n;
    if (i === toIndex) break;
    if (!closed && i === 0 && fromIndex > toIndex) break;
    maxDeviation = Math.max(maxDeviation, pointToLineDistance(points[i], start, end));
    if (!closed && i >= toIndex && fromIndex < toIndex) break;
  }

  return maxDeviation;
}

function meanSideStraightness(
  points: Point[],
  vertices: [Point, Point, Point],
  closed: boolean
): number {
  const indices = vertices.map((vertex) => nearestIndex(points, vertex));
  let score = 0;

  for (let i = 0; i < 3; i += 1) {
    const from = indices[i];
    const to = indices[(i + 1) % 3];
    const length = dist(vertices[i], vertices[(i + 1) % 3]);
    if (length < 1e-6) return 0;
    const deviation = sideDeviation(points, from, to, closed);
    score += Math.max(0, 1 - deviation / (length * 0.22));
  }

  return score / 3;
}

function turningCorners(points: Point[], count: number, minTurn: number): Point[] {
  if (points.length < 5) return [];

  const n = points.length;
  const window = Math.max(2, Math.floor(n / 18));
  const scores: { index: number; turn: number }[] = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - window + n) % n];
    const curr = points[i];
    const next = points[(i + window) % n];
    const v1 = subtract(curr, prev);
    const v2 = subtract(next, curr);
    const mag = dist(curr, prev) * dist(next, curr);
    if (mag < 1e-6) continue;
    const cosine = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / mag));
    const turn = Math.acos(cosine);
    if (turn >= minTurn) {
      scores.push({ index: i, turn });
    }
  }

  scores.sort((a, b) => b.turn - a.turn);

  const selected: { index: number; turn: number }[] = [];
  const minSeparation = Math.max(4, Math.floor(n / 8));

  for (const candidate of scores) {
    const tooClose = selected.some((existing) => {
      const delta = Math.abs(existing.index - candidate.index);
      return Math.min(delta, n - delta) < minSeparation;
    });
    if (!tooClose) selected.push(candidate);
    if (selected.length >= count) break;
  }

  selected.sort((a, b) => a.index - b.index);
  return selected.map((item) => ({ ...points[item.index] }));
}

function mergeToThree(points: Point[], clusterThreshold: number): Point[] | null {
  let current = clusterNearbyPoints(points, clusterThreshold);

  if (current.length > 3) {
    while (current.length > 3) {
      let bestI = 0;
      let bestDist = Infinity;
      for (let i = 0; i < current.length; i += 1) {
        const d = dist(current[i], current[(i + 1) % current.length]);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
        }
      }
      const merged = midpoint(current[bestI], current[(bestI + 1) % current.length]);
      const next = current.filter((_, index) => index !== bestI && index !== (bestI + 1) % current.length);
      next.splice(bestI, 0, merged);
      current = next;
    }
  }

  return current.length === 3 ? current : null;
}

export function detectTriangleVertices(
  points: Point[],
  config: RecognitionConfig
): { vertices: [Point, Point, Point]; closed: boolean } | null {
  if (points.length < config.minPointsTriangle) return null;

  const bounds = boundingBox(points);
  if (bounds.diagonal < config.minTriangleSize) return null;

  const closureDist = dist(points[0], points[points.length - 1]);
  const closed = closureDist <= Math.max(18, bounds.diagonal * config.triangleClosureRatio);

  const working =
    closed && closureDist < bounds.diagonal * 0.12
      ? points.slice(0, Math.max(2, points.length - 1))
      : points;

  const epsilons = [0.045, 0.06, 0.08, 0.1, 0.13, 0.17].map((ratio) => bounds.diagonal * ratio);
  let found: Point[] | null = null;

  for (const epsilon of epsilons) {
    const simplified = ramerDouglasPeucker(working, epsilon);
    const merged = mergeToThree(simplified, Math.max(14, bounds.diagonal * 0.09));
    if (merged) {
      found = merged;
      break;
    }
  }

  if (!found) {
    const corners = turningCorners(working, 3, (28 * Math.PI) / 180);
    const merged = corners.length >= 3 ? mergeToThree(corners.slice(0, 4), bounds.diagonal * 0.1) : null;
    if (merged) found = merged;
  }

  if (!found) return null;

  const vertices: [Point, Point, Point] = [
    { ...found[0] },
    { ...found[1] },
    { ...found[2] },
  ];

  const metrics = computeTriangleMetrics(vertices);
  const longest = Math.max(...metrics.sideLengths);
  if (longest < config.minTriangleSize * 0.35) return null;
  if (metrics.area < 0.5 * longest * longest * config.triangleMinAreaRatio) return null;

  const collinear =
    metrics.angles.some((angle) => angle < (12 * Math.PI) / 180) ||
    metrics.angles.some((angle) => angle > (168 * Math.PI) / 180);
  if (collinear) return null;

  const straightness = meanSideStraightness(points, vertices, closed);
  if (straightness < 0.42) return null;

  if (!closed) {
    const perimeter = pathLength(points) + closureDist;
    if (closureDist > perimeter * 0.22 && closureDist > bounds.diagonal * 0.28) {
      return null;
    }
  }

  return { vertices, closed };
}

export function classificationScores(
  metrics: TriangleMetrics,
  config: RecognitionConfig
): { equilateral: number; isosceles: number; right: number } {
  const [ab, bc, ca] = metrics.sideLengths;
  const maxSideRel = Math.max(
    relativeDifference(ab, bc),
    relativeDifference(bc, ca),
    relativeDifference(ca, ab)
  );
  const minSideRel = Math.min(
    relativeDifference(ab, bc),
    relativeDifference(bc, ca),
    relativeDifference(ca, ab)
  );

  const equilateral =
    maxSideRel <= config.equilateralSideTolerance
      ? 1 - maxSideRel / config.equilateralSideTolerance
      : 0;

  const isosceles =
    minSideRel <= config.isoscelesSideTolerance
      ? 1 - minSideRel / config.isoscelesSideTolerance
      : 0;

  const rightErrorDeg = Math.min(
    ...metrics.angles.map((angle) => Math.abs((angle * 180) / Math.PI - 90))
  );
  const right =
    rightErrorDeg <= config.rightAngleToleranceDeg
      ? 1 - rightErrorDeg / config.rightAngleToleranceDeg
      : 0;

  return { equilateral, isosceles, right };
}

function pickApexIndex(sideLengths: [number, number, number]): VertexIndex {
  const pairs: Array<{ shared: VertexIndex; rel: number }> = [
    { shared: 1, rel: relativeDifference(sideLengths[0], sideLengths[1]) },
    { shared: 2, rel: relativeDifference(sideLengths[1], sideLengths[2]) },
    { shared: 0, rel: relativeDifference(sideLengths[2], sideLengths[0]) },
  ];
  pairs.sort((a, b) => a.rel - b.rel);
  return pairs[0].shared;
}

function pickRightVertexIndex(angles: [number, number, number]): VertexIndex {
  let best: VertexIndex = 0;
  let bestError = Infinity;
  for (let i = 0; i < 3; i += 1) {
    const error = Math.abs(angles[i] - Math.PI / 2);
    if (error < bestError) {
      bestError = error;
      best = asVertexIndex(i);
    }
  }
  return best;
}

export function makeEquilateral(vertices: [Point, Point, Point]): [Point, Point, Point] {
  const center = centroid(vertices);
  const radius =
    (dist(center, vertices[0]) + dist(center, vertices[1]) + dist(center, vertices[2])) / 3;
  const rotation = Math.atan2(vertices[0].y - center.y, vertices[0].x - center.x);
  const winding = cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0])) >= 0 ? 1 : -1;
  const step = winding * ((Math.PI * 2) / 3);

  return [
    {
      x: center.x + Math.cos(rotation) * radius,
      y: center.y + Math.sin(rotation) * radius,
    },
    {
      x: center.x + Math.cos(rotation + step) * radius,
      y: center.y + Math.sin(rotation + step) * radius,
    },
    {
      x: center.x + Math.cos(rotation + 2 * step) * radius,
      y: center.y + Math.sin(rotation + 2 * step) * radius,
    },
  ];
}

export function makeIsosceles(
  vertices: [Point, Point, Point],
  apexIndex: VertexIndex
): [Point, Point, Point] {
  const baseA = vertices[asVertexIndex(apexIndex + 1)];
  const baseB = vertices[asVertexIndex(apexIndex + 2)];
  const apex = vertices[apexIndex];
  const baseMid = midpoint(baseA, baseB);
  const baseVec = subtract(baseB, baseA);
  const baseLen = dist(baseA, baseB);
  if (baseLen < 1e-6) return vertices;

  const perp = normalize({ x: -baseVec.y, y: baseVec.x });
  const signedHeight = pointToInfiniteLineDistance(apex, baseA, baseB);
  const side = cross(baseVec, subtract(apex, baseA)) >= 0 ? 1 : -1;
  const newApex = {
    x: baseMid.x + perp.x * signedHeight * side,
    y: baseMid.y + perp.y * signedHeight * side,
  };

  const next: [Point, Point, Point] = [{ ...vertices[0] }, { ...vertices[1] }, { ...vertices[2] }];
  next[apexIndex] = newApex;
  return next;
}

export function makeRight(
  vertices: [Point, Point, Point],
  rightIndex: VertexIndex,
  equalizeLegs: boolean
): [Point, Point, Point] {
  const c = vertices[rightIndex];
  const aIndex = asVertexIndex(rightIndex + 1);
  const bIndex = asVertexIndex(rightIndex + 2);
  const a = vertices[aIndex];
  const b = vertices[bIndex];
  const u = subtract(a, c);
  const v = subtract(b, c);
  const uLen = dist(a, c);
  const vLen = dist(b, c);
  if (uLen < 1e-6 || vLen < 1e-6) return vertices;

  const uDir = normalize(u);
  const winding = cross(u, v) >= 0 ? 1 : -1;
  const perp = { x: -uDir.y * winding, y: uDir.x * winding };

  const legA = equalizeLegs ? (uLen + vLen) / 2 : uLen;
  const legB = equalizeLegs ? (uLen + vLen) / 2 : vLen;

  const next: [Point, Point, Point] = [{ ...vertices[0] }, { ...vertices[1] }, { ...vertices[2] }];
  next[aIndex] = {
    x: c.x + uDir.x * legA,
    y: c.y + uDir.y * legA,
  };
  next[bIndex] = {
    x: c.x + perp.x * legB,
    y: c.y + perp.y * legB,
  };
  next[rightIndex] = { ...c };
  return next;
}

function buildTriangleGeometry(
  vertices: [Point, Point, Point],
  classification: TriangleClassification,
  triangleConfidence: number,
  scores: { equilateral: number; isosceles: number; right: number }
): TriangleGeometry {
  const metrics = computeTriangleMetrics(vertices);
  const center = centroid(vertices);
  const rotation = Math.atan2(vertices[0].y - center.y, vertices[0].x - center.x);
  const size = (metrics.sideLengths[0] + metrics.sideLengths[1] + metrics.sideLengths[2]) / 3;

  const geometry: TriangleGeometry = {
    type: 'triangle',
    vertices,
    classification,
    center,
    size,
    rotation,
    sideLengths: metrics.sideLengths,
    angles: metrics.angles,
    confidence: triangleConfidence,
  };

  if (classification === 'equilateral' || classification === 'isosceles' || scores.isosceles > 0.5) {
    geometry.apexIndex = pickApexIndex(metrics.sideLengths);
  }

  if (classification === 'right' || scores.right >= 0.5) {
    const rightVertexIndex = pickRightVertexIndex(metrics.angles);
    geometry.rightVertexIndex = rightVertexIndex;
    geometry.hypotenuse = {
      from: asVertexIndex(rightVertexIndex + 1),
      to: asVertexIndex(rightVertexIndex + 2),
    };
  }

  return geometry;
}

export function recognizeTriangle(
  points: Point[],
  config: RecognitionConfig
): RecognitionResult | null {
  const detected = detectTriangleVertices(points, config);
  if (!detected) return null;

  const rawMetrics = computeTriangleMetrics(detected.vertices);
  const scores = classificationScores(rawMetrics, config);
  const bounds = boundingBox(points);
  const straightness = meanSideStraightness(points, detected.vertices, detected.closed);
  const closureDist = dist(points[0], points[points.length - 1]);
  const closureScore = Math.max(
    0,
    1 - closureDist / Math.max(bounds.diagonal * config.triangleClosureRatio * 2.4, 1)
  );
  const areaScore = Math.min(1, (rawMetrics.area / (0.5 * bounds.width * bounds.height || 1)) * 1.15);
  const triangleConfidence = Math.min(
    1,
    straightness * 0.45 + closureScore * 0.25 + areaScore * 0.2 + 0.1
  );

  if (triangleConfidence < config.minTriangleConfidence) return null;

  const threshold = config.minClassificationConfidence;
  let classification: TriangleClassification = 'general';
  let vertices = detected.vertices;

  if (scores.equilateral >= threshold) {
    classification = 'equilateral';
    vertices = makeEquilateral(detected.vertices);
  } else if (scores.right >= threshold) {
    classification = 'right';
    vertices = makeRight(
      detected.vertices,
      pickRightVertexIndex(rawMetrics.angles),
      scores.isosceles >= threshold
    );
  } else if (scores.isosceles >= threshold) {
    classification = 'isosceles';
    vertices = makeIsosceles(detected.vertices, pickApexIndex(rawMetrics.sideLengths));
  }

  const geometry = buildTriangleGeometry(vertices, classification, triangleConfidence, scores);

  return { geometry, confidence: triangleConfidence };
}
