import type { DiagramSpec } from './geometry';

import type { AnnotatedEquation } from './equationAnnotation';

export type ProblemType =
  | 'quadratic'
  | 'linear'
  | 'geometry'
  | 'trigonometry'
  | 'exponential'
  | 'absolute_value'
  | 'simultaneous'
  | 'arithmetic'
  | 'probability'
  | 'graph'
  | 'expression'
  | 'unknown';

export interface MathStep {
  step: number;
  title: string;
  content: string;
  latex?: string;
  why?: string;
  annotatedEquations?: AnnotatedEquation[];
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphSpec {
  expression: string;
  displayExpression: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: GraphPoint[];
  roots?: number[];
  vertex?: GraphPoint;
}

export interface SolveResponse {
  recognizedInput: string;
  normalizedInput: string;
  problemType: ProblemType;
  equation?: string;
  steps: MathStep[];
  answer: string;
  answers?: string[];
  graph?: GraphSpec;
  diagram?: DiagramSpec;
  graphable: boolean;
  explanation?: string;
  provider?: string;
}

export interface VisualizeResponse {
  graph: GraphSpec;
  provider?: string;
}
