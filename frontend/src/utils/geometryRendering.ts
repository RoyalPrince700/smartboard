import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DOT_RADIUS,
  GRID_SIZE,
  setBoardTransform,
  type CanvasViewport,
} from './boardCoordinates';
import type { RawStroke, RecognizedGeometry } from '../types/whiteboardGeometry';
import { renderGeometry } from './shapeLibrary';
import { strokePolyline } from './shapeRenderers';

function drawStrokeAnchor(
  ctx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  radius: number,
  fill: string,
  ring: string
): void {
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawDotGrid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  ctx.fillStyle = '#e2e8f0';
  for (let x = GRID_SIZE; x < BOARD_WIDTH; x += GRID_SIZE) {
    for (let y = GRID_SIZE; y < BOARD_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export { renderGeometryObject } from './shapeRenderers';

export function renderInputCanvas(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  devicePixelRatio: number,
  rawStrokes: RawStroke[],
  activeStroke: RawStroke | null
): void {
  setBoardTransform(ctx, viewport, devicePixelRatio);
  drawDotGrid(ctx);

  const allStrokes = activeStroke ? [...rawStrokes, activeStroke] : rawStrokes;
  for (const stroke of allStrokes) {
    strokePolyline(ctx, stroke.points, stroke.color, stroke.width);
  }

  if (activeStroke && activeStroke.points.length > 0) {
    const start = activeStroke.points[0];
    const current = activeStroke.points[activeStroke.points.length - 1];
    const anchorRadius = Math.max(8, activeStroke.width * 0.85);

    drawStrokeAnchor(ctx, start, anchorRadius, activeStroke.color, '#ffffff');
    if (activeStroke.points.length > 1) {
      drawStrokeAnchor(ctx, current, anchorRadius * 0.72, activeStroke.color, '#ffffff');
    }
  }
}

export function renderGeometryCanvas(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  devicePixelRatio: number,
  geometryObjects: RecognizedGeometry[]
): void {
  setBoardTransform(ctx, viewport, devicePixelRatio);
  drawDotGrid(ctx);

  for (const item of geometryObjects) {
    renderGeometry(ctx, item.geometry, { color: item.color, width: item.width });
  }
}
