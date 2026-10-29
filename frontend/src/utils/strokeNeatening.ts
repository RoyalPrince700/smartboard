export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export const DOT_GRID_SIZE = 10;
export const DOT_RADIUS = 0.5;
export const CURVE_SNAP_SIZE = 5;

// Preferred angles for geometry / trigonometry (degrees)
const PREFERRED_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

export function snapToGrid(x: number, y: number, gridSize = DOT_GRID_SIZE): Point {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.hypot(point.x - projX, point.y - projY);
}

function isRoughlyStraight(points: Point[], gridSize: number): boolean {
  if (points.length < 2) return true;

  const start = points[0];
  const end = points[points.length - 1];
  const lineLength = dist(start, end);

  if (lineLength < gridSize * 0.8) return false;

  let maxDeviation = 0;
  for (const point of points) {
    maxDeviation = Math.max(maxDeviation, pointToLineDistance(point, start, end));
  }

  // Slightly stricter than before for cleaner geometry lines
  return maxDeviation / lineLength < 0.14;
}

/** Snap an angle (degrees) to the nearest preferred geometry angle */
function snapAngle(degrees: number): number {
  // Normalize to [0, 180) because direction of a line segment is bidirectional
  let a = ((degrees % 180) + 180) % 180;

  let best = PREFERRED_ANGLES[0];
  let bestDiff = Infinity;

  for (const preferred of PREFERRED_ANGLES) {
    const diff = Math.min(Math.abs(a - preferred), 180 - Math.abs(a - preferred));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = preferred;
    }
  }

  // Only snap if reasonably close (within ~12°)
  if (bestDiff <= 12) {
    return best;
  }
  return a; // keep original if far from any preferred angle
}

function alignToNiceAngle(start: Point, end: Point, gridSize: number): Point[] {
  const snappedStart = snapToGrid(start.x, start.y, gridSize);
  const rawEnd = { x: end.x, y: end.y };

  const dx = rawEnd.x - snappedStart.x;
  const dy = rawEnd.y - snappedStart.y;
  const length = Math.hypot(dx, dy);

  if (length < gridSize * 0.6) {
    return [snappedStart];
  }

  // Current angle in degrees
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const snappedAngle = snapAngle(angleDeg);
  const rad = (snappedAngle * Math.PI) / 180;

  // Keep original length, but force the angle
  const newEnd = {
    x: snappedStart.x + Math.cos(rad) * length,
    y: snappedStart.y + Math.sin(rad) * length,
  };

  const snappedEnd = snapToGrid(newEnd.x, newEnd.y, gridSize);

  // Final safety: if after grid snap the segment collapsed, just return start
  if (dist(snappedStart, snappedEnd) < gridSize * 0.4) {
    return [snappedStart];
  }

  return [snappedStart, snappedEnd];
}

function simplifyPoints(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

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

  if (maxDistance <= tolerance) {
    return [start, end];
  }

  const left = simplifyPoints(points.slice(0, index + 1), tolerance);
  const right = simplifyPoints(points.slice(index), tolerance);

  return [...left.slice(0, -1), ...right];
}

/** Very lightweight circle / arc detection */
/** Vector helpers */
function midPoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function normalizeVec(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * Fit a perfect circular arc that is forced to start at `start`
 * and end at `end`. Intermediate points only decide the bulge side
 * and approximate radius.
 */
function tryFitCircle(points: Point[], gridSize: number): Point[] | null {
  if (points.length < 6) return null;

  // 1. Pin start & end (snap them)
  const rawStart = points[0];
  const rawEnd = points[points.length - 1];
  const start = snapToGrid(rawStart.x, rawStart.y, gridSize);
  const end = snapToGrid(rawEnd.x, rawEnd.y, gridSize);

  const chord = dist(start, end);
  if (chord < gridSize * 1.2) return null; // too short

  // 2. Perpendicular bisector of the chord
  const mid = midPoint(start, end);
  const dir = normalizeVec(end.x - start.x, end.y - start.y);
  // Perpendicular unit vector
  const perp = { x: -dir.y, y: dir.x };

  // 3. Estimate desired radius / bulge from intermediate points
  //    We look at the point furthest from the chord (the “peak” of the arc)
  let maxBulge = 0;
  let bulgeSign = 0; // +1 or -1 relative to perp

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    // Signed distance from point to the infinite line start→end
    const signed = (p.x - start.x) * perp.x + (p.y - start.y) * perp.y;
    const abs = Math.abs(signed);
    if (abs > maxBulge) {
      maxBulge = abs;
      bulgeSign = Math.sign(signed) || 1;
    }
  }

  // If almost flat, treat as line instead of arc
  if (maxBulge < gridSize * 0.8) return null;

  // Geometry of circular arc:
  // radius r, half-chord = chord/2
  // h = bulge height (maxBulge)
  // r = (h² + (chord/2)²) / (2h)
  const halfChord = chord / 2;
  const h = maxBulge;
  let radius = (h * h + halfChord * halfChord) / (2 * h);

  // Sanity limits
  if (radius < gridSize * 1.5 || radius > 2000) return null;

  // 4. Place the center on the perpendicular bisector
  //    distance from mid to center = r - h   (or r + h for the other side, but we use the smaller one)
  const distMidToCenter = radius - h;
  const center = {
    x: mid.x + perp.x * distMidToCenter * bulgeSign,
    y: mid.y + perp.y * distMidToCenter * bulgeSign,
  };

  // Optional: snap center lightly so it looks cleaner on the grid
  // (comment out if you want pure mathematical accuracy)
  // const snappedCenter = snapToGrid(center.x, center.y, gridSize / 2);
  const snappedCenter = center;

  // Recompute radius from the pinned start point so start & end are exact
  radius = dist(snappedCenter, start);
  // (end will automatically have almost the same distance because of construction)

  // 5. Decide start & end angles
  let startAngle = Math.atan2(start.y - snappedCenter.y, start.x - snappedCenter.x);
  let endAngle = Math.atan2(end.y - snappedCenter.y, end.x - snappedCenter.x);

  // Normalize
  const normalize = (a: number) => {
    while (a < -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
  };
  startAngle = normalize(startAngle);
  endAngle = normalize(endAngle);

  // Sweep – choose the direction that matches the bulge side
  let sweep = endAngle - startAngle;
  // Force the sweep to go the way the bulge points
  const cross = (end.x - start.x) * (snappedCenter.y - start.y) - (end.y - start.y) * (snappedCenter.x - start.x);
  // cross tells us the orientation; we already have bulgeSign
  if (Math.sign(cross) !== bulgeSign) {
    // flip the sweep
    if (sweep > 0) sweep -= Math.PI * 2;
    else sweep += Math.PI * 2;
  }

  // If the user drew almost a full circle, prefer the long way
  const totalLen = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    return acc + dist(points[i - 1], p);
  }, 0);
  const isAlmostFull = totalLen > radius * 4.5; // rough heuristic

  if (isAlmostFull && Math.abs(sweep) < Math.PI * 1.2) {
    sweep = sweep > 0 ? sweep - Math.PI * 2 : sweep + Math.PI * 2;
  }

  // 6. Generate dense, perfectly circular points
  //    More points = smoother (no visible corners)
  const arcLength = Math.abs(sweep) * radius;
  const numPoints = Math.max(24, Math.min(120, Math.round(arcLength / 3))); // ~3px steps

  const result: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const a = startAngle + sweep * t;
    result.push({
      x: snappedCenter.x + Math.cos(a) * radius,
      y: snappedCenter.y + Math.sin(a) * radius,
    });
  }

  // Force exact start & end (floating-point safety)
  result[0] = { ...start };
  result[result.length - 1] = { ...end };

  return result;
}

/** Close the stroke if start and end are close */
function maybeClose(points: Point[], gridSize: number): Point[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (dist(first, last) < gridSize * 2.2) {
    return [...points.slice(0, -1), { ...first }];
  }
  return points;
}

export function neatenStrokePoints(points: Point[], gridSize = DOT_GRID_SIZE): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [snapToGrid(points[0].x, points[0].y, gridSize)];

  // 1. Try circle / arc first (more specific)
  const circlePoints = tryFitCircle(points, gridSize);
  if (circlePoints) {
    return circlePoints;
  }

  // 2. Straight line with nice angle snapping
  if (isRoughlyStraight(points, gridSize)) {
    return alignToNiceAngle(points[0], points[points.length - 1], gridSize);
  }

  // 3. Fallback: snap + simplify + close if nearly closed
  const snapped = points.map((p) => snapToGrid(p.x, p.y, CURVE_SNAP_SIZE));
  let simplified = simplifyPoints(snapped, 2.8);

  // Deduplicate consecutive points
  const deduped: Point[] = [];
  for (const p of simplified) {
    const last = deduped[deduped.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) {
      deduped.push(p);
    }
  }

  return maybeClose(deduped, gridSize);
}

export function neatenStroke(stroke: Stroke, gridSize = DOT_GRID_SIZE): Stroke {
  return {
    ...stroke,
    points: neatenStrokePoints(stroke.points, gridSize),
  };
}