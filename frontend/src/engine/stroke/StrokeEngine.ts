import { v4 as uuidv4 } from 'uuid';
import { Point, ShapeBounds, ShapeType, Stroke, StrokeTool, TextSegment } from '../../types/stroke';

export interface StartStrokeOptions {
  tool: StrokeTool;
  color: string;
  width: number;
  opacity?: number;
  shapeType?: ShapeType;
  point: Point;
  shapeBounds?: ShapeBounds;
  textContent?: string;
  textSegments?: TextSegment[];
  tag?: string;
}

export function createPoint(
  x: number,
  y: number,
  pressure = 0.5,
  timestamp = Date.now()
): Point {
  return { x, y, pressure, timestamp };
}

export function startStroke(options: StartStrokeOptions): Stroke {
  const { tool, color, width, opacity, shapeType, point, shapeBounds, textContent, textSegments, tag } =
    options;

  return {
    id: uuidv4(),
    tool,
    points: tool === 'shape' || tool === 'text' ? [] : [point],
    width,
    color,
    opacity,
    shapeType,
    shapeBounds: shapeBounds ?? (tool === 'shape' ? { x1: point.x, y1: point.y, x2: point.x, y2: point.y } : undefined),
    textContent,
    textSegments,
    tag,
    finished: tool === 'text',
  };
}

export function appendPoint(stroke: Stroke, point: Point): Stroke {
  return {
    ...stroke,
    points: [...stroke.points, point],
  };
}

export function updateShapeBounds(stroke: Stroke, bounds: ShapeBounds): Stroke {
  return {
    ...stroke,
    shapeBounds: bounds,
  };
}

export function finishStroke(stroke: Stroke): Stroke {
  return { ...stroke, finished: true };
}

export function normalizeBounds(bounds: ShapeBounds): ShapeBounds {
  return {
    x1: Math.min(bounds.x1, bounds.x2),
    y1: Math.min(bounds.y1, bounds.y2),
    x2: Math.max(bounds.x1, bounds.x2),
    y2: Math.max(bounds.y1, bounds.y2),
  };
}
