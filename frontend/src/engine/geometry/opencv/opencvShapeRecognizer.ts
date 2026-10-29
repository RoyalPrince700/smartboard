import type { Stroke } from '../../../types/stroke';
import type {
  OpenCVDebugSnapshot,
  RecognizedShape,
  RecognizedShapeType,
  ShapeMeasurement,
} from '../../../types/geometry';
import { isLikelyLabelStroke, splitShapeAndLabelStrokes } from '../shapeRecognizer';
import { getOpenCV, loadOpenCV, type OpenCVMat } from './opencvLoader';
import {
  angleBetweenSegments,
  boundsFromVertices,
  classifyPolygon,
  contourToPoints,
  edgesFromVertices,
  extractLineSegments,
  mapRasterPointsToCanvas,
  preprocessBinaryMat,
} from './opencvGeometryUtils';
import { rasterizeStrokes, type StrokeRasterResult } from './strokeRasterizer';

function formatNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function measurementsFor(type: RecognizedShapeType, vertices: Array<{ x: number; y: number }>): ShapeMeasurement[] {
  if (type === 'line' && vertices.length >= 2) {
    const length = dist(vertices[0], vertices[1]);
    return [{ name: 'Length', value: `${formatNum(length)} px`, numericValue: length }];
  }
  if (type === 'triangle' && vertices.length >= 3) {
    return [0, 1, 2].map((index) => ({
      name: `Side ${index + 1}`,
      value: `${formatNum(dist(vertices[index], vertices[(index + 1) % 3]))} px`,
      numericValue: dist(vertices[index], vertices[(index + 1) % 3]),
    }));
  }
  if ((type === 'rectangle' || type === 'polygon') && vertices.length >= 3) {
    const bounds = boundsFromVertices(vertices.map((v, i) => ({ id: String(i), ...v })));
    return [
      { name: 'Width', value: `${formatNum(bounds.x2 - bounds.x1)} px`, numericValue: bounds.x2 - bounds.x1 },
      { name: 'Height', value: `${formatNum(bounds.y2 - bounds.y1)} px`, numericValue: bounds.y2 - bounds.y1 },
    ];
  }
  if (type === 'circle' && vertices.length >= 1) {
    const radius = vertices[0].x;
    return [{ name: 'Approx. radius', value: `${formatNum(radius)} px`, numericValue: radius }];
  }
  return [];
}

function detectCircle(
  cv: NonNullable<ReturnType<typeof getOpenCV>>,
  binary: OpenCVMat,
  raster: StrokeRasterResult
): RecognizedShape | null {
  const circlesMat = new cv.Mat();
  const minRadius = Math.max(8, Math.min(binary.cols, binary.rows) * 0.08);
  const maxRadius = Math.max(minRadius + 1, Math.min(binary.cols, binary.rows) * 0.55);
  cv.HoughCircles(
    binary,
    circlesMat,
    cv.HOUGH_GRADIENT,
    1.2,
    Math.max(20, minRadius),
    100,
    30,
    Math.floor(minRadius),
    Math.floor(maxRadius)
  );

  if (circlesMat.cols === 0) {
    circlesMat.delete();
    return null;
  }

  const cx = circlesMat.floatPtr(0, 0);
  const cy = circlesMat.floatPtr(0, 1);
  const radius = circlesMat.floatPtr(0, 2);
  circlesMat.delete();

  const center = mapRasterPointsToCanvas([{ x: cx, y: cy }], raster)[0];
  const canvasRadius = radius / raster.scale;
  return {
    id: 'opencv-circle-1',
    strokeId: 'opencv',
    type: 'circle',
    bounds: {
      x1: center.x - canvasRadius,
      y1: center.y - canvasRadius,
      x2: center.x + canvasRadius,
      y2: center.y + canvasRadius,
    },
    vertices: [center],
    edges: [],
    measurements: [{ name: 'Approx. radius', value: `${formatNum(canvasRadius)} px`, numericValue: canvasRadius }],
    labels: [],
    confidence: 0.78,
    source: 'opencv',
  };
}

function detectContourShape(
  cv: NonNullable<ReturnType<typeof getOpenCV>>,
  binary: OpenCVMat,
  raster: StrokeRasterResult,
  index: number
): { shape: RecognizedShape | null; contourPoints: Array<{ x: number; y: number }>; vertexCount: number } {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(binary, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let bestShape: RecognizedShape | null = null;
  let bestArea = 0;
  let bestContourPoints: Array<{ x: number; y: number }> = [];
  let bestVertexCount = 0;

  for (let i = 0; i < contours.size(); i += 1) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area < binary.cols * binary.rows * 0.005) continue;

    const perimeter = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.03 * perimeter, true);
    const rasterPoints = contourToPoints(approx);
    approx.delete();

    const vertices = mapRasterPointsToCanvas(rasterPoints, raster);
    const { type, confidence } = classifyPolygon(vertices);
    if (area > bestArea && type !== 'unknown') {
      bestArea = area;
      bestVertexCount = vertices.length;
      bestContourPoints = vertices.map((v) => ({ x: v.x, y: v.y }));
      const finalVertices =
        type === 'triangle' ? vertices.slice(0, 3) : type === 'rectangle' ? vertices.slice(0, 4) : vertices;
      bestShape = {
        id: `opencv-contour-${index}-${i}`,
        strokeId: 'opencv',
        type,
        bounds: boundsFromVertices(finalVertices),
        vertices: finalVertices,
        edges: edgesFromVertices(finalVertices),
        measurements: measurementsFor(type, finalVertices),
        labels: [],
        confidence,
        source: 'opencv',
      };
    }
  }

  contours.delete();
  hierarchy.delete();
  return { shape: bestShape, contourPoints: bestContourPoints, vertexCount: bestVertexCount };
}

function detectAngleFromLines(
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>
): RecognizedShape | null {
  if (lines.length < 2) return null;

  let best: RecognizedShape | null = null;
  let bestConfidence = 0;

  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const endpoints = [
        { v: { x: lines[i].x1, y: lines[i].y1 }, far: { x: lines[i].x2, y: lines[i].y2 } },
        { v: { x: lines[i].x2, y: lines[i].y2 }, far: { x: lines[i].x1, y: lines[i].y1 } },
      ];
      const endpointsB = [
        { v: { x: lines[j].x1, y: lines[j].y1 }, far: { x: lines[j].x2, y: lines[j].y2 } },
        { v: { x: lines[j].x2, y: lines[j].y2 }, far: { x: lines[j].x1, y: lines[j].y1 } },
      ];

      for (const a of endpoints) {
        for (const b of endpointsB) {
          if (dist(a.v, b.v) > 36) continue;
          const vertex = {
            x: (a.v.x + b.v.x) / 2,
            y: (a.v.y + b.v.y) / 2,
          };
          const { degrees, kind } = angleBetweenSegments(a.far, vertex, b.far);
          const confidence = kind === 'right' ? 0.84 : degrees > 20 ? 0.72 : 0.55;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            const vertices = [
              { id: 'A', x: Math.round(a.far.x * 100) / 100, y: Math.round(a.far.y * 100) / 100 },
              { id: 'B', x: Math.round(vertex.x * 100) / 100, y: Math.round(vertex.y * 100) / 100 },
              { id: 'C', x: Math.round(b.far.x * 100) / 100, y: Math.round(b.far.y * 100) / 100 },
            ];
            best = {
              id: 'opencv-angle-1',
              strokeId: 'opencv',
              type: 'line',
              vertices,
              edges: [
                { from: 'B', to: 'A' },
                { from: 'B', to: 'C' },
              ],
              measurements: [{ name: 'Angle', value: `${formatNum(degrees)}°`, numericValue: degrees }],
              labels: [kind === 'right' ? 'right angle' : `${kind} angle`],
              confidence,
              source: 'opencv',
            };
          }
        }
      }
    }
  }

  return best;
}

function detectSingleLine(
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>
): RecognizedShape | null {
  if (lines.length === 0) return null;
  const longest = [...lines].sort(
    (a, b) => dist({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }) - dist({ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 })
  )[0];
  const vertices = [
    { id: 'A', x: Math.round(longest.x1 * 100) / 100, y: Math.round(longest.y1 * 100) / 100 },
    { id: 'B', x: Math.round(longest.x2 * 100) / 100, y: Math.round(longest.y2 * 100) / 100 },
  ];
  return {
    id: 'opencv-line-1',
    strokeId: 'opencv',
    type: 'line',
    vertices,
    edges: [{ from: 'A', to: 'B' }],
    measurements: measurementsFor('line', vertices),
    labels: [],
    confidence: 0.74,
    source: 'opencv',
  };
}

export interface OpenCVRecognitionResult {
  shapes: RecognizedShape[];
  debug?: OpenCVDebugSnapshot;
}

export async function recognizeBoardShapesOpenCV(
  strokes: Stroke[],
  options?: { collectDebug?: boolean }
): Promise<OpenCVRecognitionResult> {
  const cv = await loadOpenCV();
  const { shapeStrokes } = splitShapeAndLabelStrokes(strokes);
  const geometryStrokes = shapeStrokes.filter((stroke) => !isLikelyLabelStroke(stroke));

  if (!cv || geometryStrokes.length === 0) {
    return { shapes: [] };
  }

  const raster = rasterizeStrokes(geometryStrokes);
  if (!raster) return { shapes: [] };

  const src = cv.imread(raster.canvas);
  const binary = preprocessBinaryMat(cv, src);
  src.delete();

  const lines = extractLineSegments(cv, binary, raster);
  const circle = detectCircle(cv, binary, raster);
  const contourResult = detectContourShape(cv, binary, raster, 0);
  const angle = detectAngleFromLines(lines);
  const line = detectSingleLine(lines);

  binary.delete();

  const candidates = [contourResult.shape, circle, angle, line].filter((shape): shape is RecognizedShape => Boolean(shape));
  const shapes = candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 2);

  if (options?.collectDebug) {
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = raster.canvas.width;
    debugCanvas.height = raster.canvas.height;
    const ctx = debugCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(raster.canvas, 0, 0);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      for (const detectedLine of lines) {
        const p1 = {
          x: (detectedLine.x1 - raster.bounds.x1) * raster.scale,
          y: (detectedLine.y1 - raster.bounds.y1) * raster.scale,
        };
        const p2 = {
          x: (detectedLine.x2 - raster.bounds.x1) * raster.scale,
          y: (detectedLine.y2 - raster.bounds.y1) * raster.scale,
        };
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    return {
      shapes,
      debug: {
        maskDataUrl: debugCanvas.toDataURL('image/png'),
        contourCount: contourResult.vertexCount > 0 ? 1 : 0,
        contours: contourResult.contourPoints.length
          ? [{ points: contourResult.contourPoints, vertexCount: contourResult.vertexCount }]
          : [],
        lines,
        circles: circle?.vertices?.[0]
          ? [
              {
                cx: circle.vertices[0].x,
                cy: circle.vertices[0].y,
                radius: circle.measurements[0]?.numericValue ?? 0,
              },
            ]
          : [],
        recognizedShapes: shapes,
        fusedShapes: shapes,
      },
    };
  }

  return { shapes };
}
