import { ShapeBounds, ShapeType, Stroke } from './stroke';

export type DiagramElementType =
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'triangle'
  | 'polygon'
  | 'arrow'
  | 'label'
  | 'arc'
  | 'point';

export interface DiagramPoint {
  x: number;
  y: number;
}

export interface DiagramElement {
  type: DiagramElementType;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  width?: number;
  height?: number;
  points?: DiagramPoint[];
  text?: string;
  label?: string;
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

export type DiagramCategory = 'geometry' | 'scientific' | 'flowchart' | 'coordinate' | 'custom';

export interface DiagramSpec {
  title: string;
  category: DiagramCategory;
  width: number;
  height: number;
  elements: DiagramElement[];
  description?: string;
}

export type RecognizedShapeType =
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'freehand'
  | 'unknown';

export interface ShapeMeasurement {
  name: string;
  value: string;
  numericValue?: number;
}

export interface GeometryBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RecognizedShape {
  id: string;
  strokeId: string;
  type: RecognizedShapeType;
  shapeType?: ShapeType;
  bounds?: ShapeBounds;
  measurements: ShapeMeasurement[];
  labels: string[];
  confidence: number;
}

export interface GeometryScenePoint {
  id: string;
  x: number;
  y: number;
}

export interface GeometrySceneSegment {
  id: string;
  strokeId?: string;
  p1: string;
  p2: string;
  length: number;
  angleDeg: number;
  kind: 'line' | 'side' | 'construction';
  label?: string;
}

export interface GeometrySceneAngle {
  id: string;
  vertex: string;
  ray1: string;
  ray2: string;
  valueDeg?: number;
  label?: string;
  isMarked: boolean;
}

export interface GeometrySceneRelation {
  type: 'parallel' | 'equalLength' | 'knownAngle' | 'unknownAngle' | 'intersection';
  targetIds: string[];
  value?: number | string;
  confidence: number;
}

export interface GeometrySceneLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  targetId?: string;
  kind: 'angle' | 'side' | 'point' | 'note' | 'unknown';
}

export interface GeometryScene {
  points: GeometryScenePoint[];
  segments: GeometrySceneSegment[];
  angles: GeometrySceneAngle[];
  labels: GeometrySceneLabel[];
  relations: GeometrySceneRelation[];
  bounds?: GeometryBounds;
}

export interface DiagramAnalysis {
  shapes: RecognizedShape[];
  scene?: GeometryScene;
  recognizedLabels: string[];
  textAnnotations: string[];
  measurements: ShapeMeasurement[];
  diagram?: DiagramSpec;
  graph?: import('./math').GraphSpec;
  explanation?: string;
  summary: string;
}

export interface AnalyzeDiagramRequest {
  strokes?: Stroke[];
  imageBase64?: string;
  text?: string;
  context?: import('./ai').AIContext;
  boardId?: string;
  generateDiagram?: boolean;
}

export interface VisualizeRequestExtended {
  expression?: string;
  text?: string;
  strokes?: Stroke[];
  imageBase64?: string;
  mode?: 'function' | 'geometry' | 'diagram' | 'auto';
  diagramType?: string;
  xMin?: number;
  xMax?: number;
  boardId?: string;
}

export interface VisualizeResponseExtended {
  graph?: import('./math').GraphSpec;
  diagram?: DiagramSpec;
  analysis?: DiagramAnalysis;
  provider: string;
}
