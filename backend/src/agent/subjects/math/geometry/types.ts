/**
 * Shared types for geometry topic modules.
 */

import { ReasoningTrace } from '../../../schemas/reasoning.schema';

export type PartialReasoningTrace = Partial<ReasoningTrace>;

export type GeometryShape =
  | 'triangle'
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'line'
  | 'angle_diagram'
  | 'unknown';

export type GeometryFind =
  | 'area'
  | 'perimeter'
  | 'circumference'
  | 'hypotenuse'
  | 'missing_side'
  | 'unknown_angle'
  | 'all';

export interface ParsedGeometryProblem {
  shapeType: GeometryShape;
  find: GeometryFind;
  unit: string;
  sides: number[];
  base?: number;
  height?: number;
  length?: number;
  width?: number;
  radius?: number;
  diameter?: number;
  knownAngles: number[];
  unknownAngleCount: number;
  parallelPairs: number;
  equalLengthPairs: number;
  isRightTriangle: boolean;
  labels: string[];
  rawInput: string;
}
