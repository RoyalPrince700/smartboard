export type ProblemType =
  | 'quadratic'
  | 'linear'
  | 'exponential'
  | 'absolute_value'
  | 'simultaneous'
  | 'arithmetic'
  | 'probability'
  | 'graph'
  | 'expression'
  | 'unknown';

export interface TermCancellation {
  side: 'left' | 'right';
  term: string;
  match?: 'first' | 'last' | number;
}

export interface AnnotatedEquation {
  text: string;
  cancellations?: TermCancellation[];
}

export interface MathStep {
  step: number;
  title: string;
  content: string;
  latex?: string;
  /** Structured equation lines with optional cancellation overlays (operation step only). */
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

export interface SolveResult {
  recognizedInput: string;
  normalizedInput: string;
  problemType: ProblemType;
  equation?: string;
  steps: MathStep[];
  answer: string;
  answers?: string[];
  graph?: GraphSpec;
  graphable: boolean;
  explanation?: string;
}

export interface SolveRequest {
  input?: string;
  strokes?: import('./stroke').Stroke[];
  imageBase64?: string;
  context?: import('./ai').AIContext;
  boardId?: string;
  includeGraph?: boolean;
}

export interface VisualizeRequest {
  expression: string;
  xMin?: number;
  xMax?: number;
}

export interface VisualizeResponse {
  graph: GraphSpec;
}
