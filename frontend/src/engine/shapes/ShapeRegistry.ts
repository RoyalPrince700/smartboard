import { ShapeBounds, ShapeType, Stroke } from '../../types/stroke';

export type ShapeRenderer = (
  ctx: CanvasRenderingContext2D,
  bounds: ShapeBounds,
  stroke: Stroke
) => void;

const shapeRenderers: Record<ShapeType, ShapeRenderer> = {
  line: (ctx, bounds, stroke) => {
    ctx.beginPath();
    ctx.moveTo(bounds.x1, bounds.y1);
    ctx.lineTo(bounds.x2, bounds.y2);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  rectangle: (ctx, bounds, stroke) => {
    const x = Math.min(bounds.x1, bounds.x2);
    const y = Math.min(bounds.y1, bounds.y2);
    const w = Math.abs(bounds.x2 - bounds.x1);
    const h = Math.abs(bounds.y2 - bounds.y1);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.strokeRect(x, y, w, h);
  },

  circle: (ctx, bounds, stroke) => {
    const cx = (bounds.x1 + bounds.x2) / 2;
    const cy = (bounds.y1 + bounds.y2) / 2;
    const rx = Math.abs(bounds.x2 - bounds.x1) / 2;
    const ry = Math.abs(bounds.y2 - bounds.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.stroke();
  },

  triangle: (ctx, bounds, stroke) => {
    const x1 = (bounds.x1 + bounds.x2) / 2;
    const y1 = bounds.y1;
    const x2 = bounds.x1;
    const y2 = bounds.y2;
    const x3 = bounds.x2;
    const y3 = bounds.y2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.stroke();
  },
};

export function registerShape(type: ShapeType, renderer: ShapeRenderer): void {
  shapeRenderers[type] = renderer;
}

export function renderShape(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (!stroke.shapeType || !stroke.shapeBounds) return;
  const renderer = shapeRenderers[stroke.shapeType];
  if (renderer) renderer(ctx, stroke.shapeBounds, stroke);
}

export function getRegisteredShapes(): ShapeType[] {
  return Object.keys(shapeRenderers) as ShapeType[];
}
