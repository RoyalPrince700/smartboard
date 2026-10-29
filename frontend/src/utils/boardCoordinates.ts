import type { Point } from '../types/whiteboardGeometry';

/** Fixed logical board space — geometry lives here, not in canvas pixels. */
export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 700;

/** Visual dot grid spacing in logical units. */
export const GRID_SIZE = 10;
export const DOT_RADIUS = 0.5;

export interface CanvasViewport {
  width: number;
  height: number;
}

export function screenToBoardPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const cssX = clientX - rect.left;
  const cssY = clientY - rect.top;

  return {
    x: (cssX / rect.width) * BOARD_WIDTH,
    y: (cssY / rect.height) * BOARD_HEIGHT,
  };
}

export function boardToCanvasPoint(point: Point, viewport: CanvasViewport): Point {
  return {
    x: (point.x / BOARD_WIDTH) * viewport.width,
    y: (point.y / BOARD_HEIGHT) * viewport.height,
  };
}

export function getBoardScale(viewport: CanvasViewport): { scaleX: number; scaleY: number } {
  return {
    scaleX: viewport.width / BOARD_WIDTH,
    scaleY: viewport.height / BOARD_HEIGHT,
  };
}

/** Apply transform so all drawing uses logical board coordinates. */
export function setBoardTransform(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  devicePixelRatio: number
): void {
  const scaleX = (viewport.width / BOARD_WIDTH) * devicePixelRatio;
  const scaleY = (viewport.height / BOARD_HEIGHT) * devicePixelRatio;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}

export function clampBoardPoint(point: Point): Point {
  return {
    x: Math.max(0, Math.min(BOARD_WIDTH, point.x)),
    y: Math.max(0, Math.min(BOARD_HEIGHT, point.y)),
  };
}
