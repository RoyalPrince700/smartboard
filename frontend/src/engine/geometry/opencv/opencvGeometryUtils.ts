import type { GeometryBounds, GeometryEdge, GeometryVertex, RecognizedShapeType } from '../../../types/geometry';
import type { OpenCVMat, OpenCVModule } from './opencvLoader';
import { canvasToRaster, rasterToCanvas, type StrokeRasterResult } from './strokeRasterizer';

interface Point {
  x: number;
  y: number;
}

const VERTEX_IDS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function contourToPoints(contour: OpenCVMat): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < contour.rows; i += 1) {
    points.push({ x: contour.intPtr(i, 0), y: contour.intPtr(i, 1) });
  }
  return points;
}

export function mapRasterPointsToCanvas(points: Point[], raster: StrokeRasterResult): GeometryVertex[] {
  return points.map((point, index) => {
    const mapped = rasterToCanvas(point, raster);
    return {
      id: VERTEX_IDS[index] ?? `P${index + 1}`,
      x: Math.round(mapped.x * 100) / 100,
      y: Math.round(mapped.y * 100) / 100,
    };
  });
}

export function edgesFromVertices(vertices: GeometryVertex[]): GeometryEdge[] {
  if (vertices.length < 2) return [];
  const edges: GeometryEdge[] = [];
  for (let i = 0; i < vertices.length; i += 1) {
    edges.push({ from: vertices[i].id, to: vertices[(i + 1) % vertices.length].id });
  }
  return edges;
}

export function boundsFromVertices(vertices: GeometryVertex[]): GeometryBounds {
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

export function almostEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function classifyPolygon(vertices: GeometryVertex[]): {
  type: RecognizedShapeType;
  confidence: number;
} {
  const count = vertices.length;
  if (count <= 2) return { type: 'line', confidence: 0.68 };
  if (count === 3) return { type: 'triangle', confidence: 0.88 };

  if (count === 4) {
    const sides = [
      dist(vertices[0], vertices[1]),
      dist(vertices[1], vertices[2]),
      dist(vertices[2], vertices[3]),
      dist(vertices[3], vertices[0]),
    ];
    const oppositeSimilar =
      almostEqual(sides[0], sides[2], Math.max(sides[0], sides[2]) * 0.18) &&
      almostEqual(sides[1], sides[3], Math.max(sides[1], sides[3]) * 0.18);
    const allSimilar = sides.every((side) => almostEqual(side, sides[0], sides[0] * 0.15));
    if (allSimilar) return { type: 'rectangle', confidence: 0.9 };
    if (oppositeSimilar) return { type: 'rectangle', confidence: 0.82 };
    return { type: 'polygon', confidence: 0.62 };
  }

  if (count >= 5) return { type: 'polygon', confidence: 0.58 };
  return { type: 'unknown', confidence: 0.45 };
}

function dist(a: GeometryVertex | Point, b: GeometryVertex | Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function angleBetweenSegments(
  p1: Point,
  vertex: Point,
  p2: Point
): { degrees: number; kind: 'acute' | 'right' | 'obtuse' } {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return { degrees: 0, kind: 'acute' };
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  const degrees = (Math.acos(cos) * 180) / Math.PI;
  const kind = almostEqual(degrees, 90, 8) ? 'right' : degrees < 90 ? 'acute' : 'obtuse';
  return { degrees: Math.round(degrees * 10) / 10, kind };
}

export function preprocessBinaryMat(cv: OpenCVModule, src: OpenCVMat): OpenCVMat {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const binary = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blurred, { width: 3, height: 3 }, 0);
  cv.threshold(blurred, binary, 180, 255, cv.THRESH_BINARY);
  gray.delete();
  blurred.delete();
  return binary;
}

export function extractLineSegments(
  cv: OpenCVModule,
  binary: OpenCVMat,
  raster: StrokeRasterResult
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const linesMat = new cv.Mat();
  cv.HoughLinesP(binary, linesMat, 1, Math.PI / 180, 40, Math.max(24, binary.cols * 0.08), 12);

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 0; i < linesMat.rows; i += 1) {
    const x1 = linesMat.data32S ? linesMat.data32S[i * 4] : linesMat.intPtr(i, 0);
    const y1 = linesMat.data32S ? linesMat.data32S[i * 4 + 1] : linesMat.intPtr(i, 1);
    const x2 = linesMat.data32S ? linesMat.data32S[i * 4 + 2] : linesMat.intPtr(i, 2);
    const y2 = linesMat.data32S ? linesMat.data32S[i * 4 + 3] : linesMat.intPtr(i, 3);
    const p1 = rasterToCanvas({ x: x1, y: y1 }, raster);
    const p2 = rasterToCanvas({ x: x2, y: y2 }, raster);
    lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }
  linesMat.delete();
  return lines;
}

export function mapCanvasLineToRaster(
  line: { x1: number; y1: number; x2: number; y2: number },
  raster: StrokeRasterResult
): { x1: number; y1: number; x2: number; y2: number } {
  const p1 = canvasToRaster({ x: line.x1, y: line.y1 }, raster);
  const p2 = canvasToRaster({ x: line.x2, y: line.y2 }, raster);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}
