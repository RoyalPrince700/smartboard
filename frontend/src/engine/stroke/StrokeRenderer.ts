import { CanvasSettings, Stroke } from '../../types/stroke';
import { renderShape } from '../shapes/ShapeRegistry';
import { drawRichTextLine } from './RichTextRenderer';

function drawFreehandStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const points = stroke.points;
  if (points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;

  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = stroke.opacity ?? 0.35;
    ctx.globalCompositeOperation = 'multiply';
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawTextStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (!stroke.shapeBounds) return;

  const fontSize = stroke.width * 8;
  const baselineY = stroke.shapeBounds.y2;

  if (stroke.textSegments?.length) {
    drawRichTextLine(
      ctx,
      stroke.textSegments,
      stroke.shapeBounds.x1,
      baselineY,
      fontSize,
      stroke.color,
      stroke.width
    );
    return;
  }

  if (!stroke.textContent) return;

  ctx.save();
  ctx.fillStyle = stroke.color;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(stroke.textContent, stroke.shapeBounds.x1, baselineY);
  ctx.restore();
}

export function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.tool === 'eraser') return;

  if (stroke.tool === 'shape') {
    renderShape(ctx, stroke);
    return;
  }

  if (stroke.tool === 'text') {
    drawTextStroke(ctx, stroke);
    return;
  }

  drawFreehandStroke(ctx, stroke);
}

export function renderAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  settings: CanvasSettings
): void {
  const { width, height, backgroundColor } = settings;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (settings.gridEnabled) {
    drawGrid(ctx, width, height);
  }

  for (const stroke of strokes) {
    renderStroke(ctx, stroke);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gridSize = 40;
  ctx.save();
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  event?: PointerEvent
): { x: number; y: number } {
  if (event?.target === canvas) {
    return { x: event.offsetX, y: event.offsetY };
  }

  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function setupCanvasDPI(
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.scale(dpr, dpr);
  return ctx;
}
