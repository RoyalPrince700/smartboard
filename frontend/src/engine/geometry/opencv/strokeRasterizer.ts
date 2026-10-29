import type { Stroke } from '../../../types/stroke';

export interface RasterBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface StrokeRasterResult {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  bounds: RasterBounds;
  padding: number;
  scale: number;
}

interface Point {
  x: number;
  y: number;
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

function computeBounds(strokes: Stroke[], padding: number): RasterBounds | null {
  const points = strokes.flatMap(strokePoints);
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x1: Math.min(...xs) - padding,
    y1: Math.min(...ys) - padding,
    x2: Math.max(...xs) + padding,
    y2: Math.max(...ys) + padding,
  };
}

export function rasterizeStrokes(
  strokes: Stroke[],
  options?: { padding?: number; lineWidth?: number; maxSize?: number }
): StrokeRasterResult | null {
  const padding = options?.padding ?? 24;
  const lineWidth = options?.lineWidth ?? 4;
  const maxSize = options?.maxSize ?? 640;

  const bounds = computeBounds(strokes, padding);
  if (!bounds) return null;

  const sourceW = Math.max(bounds.x2 - bounds.x1, 1);
  const sourceH = Math.max(bounds.y2 - bounds.y1, 1);
  const scale = Math.min(1, maxSize / Math.max(sourceW, sourceH));
  const width = Math.max(32, Math.ceil(sourceW * scale));
  const height = Math.max(32, Math.ceil(sourceH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const toRaster = (point: Point): Point => ({
    x: (point.x - bounds.x1) * scale,
    y: (point.y - bounds.y1) * scale,
  });

  for (const stroke of strokes) {
    const points = strokePoints(stroke);
    if (points.length < 2) continue;
    ctx.lineWidth = Math.max(2, (stroke.width || lineWidth) * scale);
    ctx.beginPath();
    const first = toRaster(points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const p = toRaster(points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  return { canvas, imageData, bounds, padding, scale };
}

export function rasterToCanvas(point: Point, raster: StrokeRasterResult): Point {
  return {
    x: point.x / raster.scale + raster.bounds.x1,
    y: point.y / raster.scale + raster.bounds.y1,
  };
}

export function canvasToRaster(point: Point, raster: StrokeRasterResult): Point {
  return {
    x: (point.x - raster.bounds.x1) * raster.scale,
    y: (point.y - raster.bounds.y1) * raster.scale,
  };
}
