export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export type StrokeTool = 'pen' | 'highlighter' | 'eraser' | 'shape' | 'text';

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'triangle';

export interface TextSegment {
  type: 'text' | 'fraction';
  text?: string;
  numerator?: string;
  denominator?: string;
}

export interface ShapeBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Stroke {
  id: string;
  tool: StrokeTool;
  points: Point[];
  width: number;
  color: string;
  opacity?: number;
  shapeType?: ShapeType;
  shapeBounds?: ShapeBounds;
  textContent?: string;
  textSegments?: TextSegment[];
  tag?: string;
  finished: boolean;
}

export const AI_EXPLANATION_TAG = 'ai-explanation';
export const VOICE_EQUATION_TAG = 'voice-equation';

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  gridEnabled: boolean;
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  width: 1920,
  height: 1080,
  backgroundColor: '#ffffff',
  gridEnabled: false,
};

export const STROKE_DATA_VERSION = 1;
