import type { GraphSpec } from './math';
import type { ShapeBounds, ShapeType } from './stroke';

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
  startAngle?: number;
  endAngle?: number;
}

export type DiagramCategory = 'geometry' | 'scientific' | 'flowchart' | 'coordinate' | 'custom';

export interface DiagramSpec {
  title: string;
  category?: DiagramCategory;
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

export interface GeometryVertex {
  id: string;
  x: number;
  y: number;
}

export interface GeometryEdge {
  from: string;
  to: string;
}

export interface RecognizedShape {
  id: string;
  strokeId: string;
  type: RecognizedShapeType;
  shapeType?: ShapeType;
  bounds?: ShapeBounds;
  vertices?: GeometryVertex[];
  edges?: GeometryEdge[];
  measurements: ShapeMeasurement[];
  labels: string[];
  confidence: number;
  source?: 'heuristic' | 'opencv' | 'fused';
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
  isMarked?: boolean;
  mark?: 'arc' | 'square' | 'right';
}

export interface GeometrySceneRelation {
  type: 'parallel' | 'equalLength' | 'knownAngle' | 'unknownAngle' | 'intersection';
  targetIds: string[];
  value?: number | string;
  confidence?: number;
}

export interface GeometrySceneLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  targetId?: string;
  kind?: 'angle' | 'side' | 'point' | 'note' | 'unknown';
}

export interface GeometrySceneShape {
  id: string;
  type: RecognizedShapeType;
  confidence: number;
  vertices: GeometryVertex[];
  edges: GeometryEdge[];
  bounds?: GeometryBounds;
  source?: 'heuristic' | 'opencv' | 'fused' | string;
}

export interface GeometryRecognitionMeta {
  heuristic?: { type: RecognizedShapeType; confidence: number };
  opencv?: { type: RecognizedShapeType; confidence: number; available: boolean };
  fused?: { type: RecognizedShapeType; confidence: number; agreement: boolean };
}

export interface GeometryScene {
  type?: 'geometry_scene';
  points: GeometryScenePoint[];
  segments: GeometrySceneSegment[];
  angles: GeometrySceneAngle[];
  labels: GeometrySceneLabel[];
  relations: GeometrySceneRelation[];
  bounds?: GeometryBounds;
  shapes?: GeometrySceneShape[];
  recognition?: GeometryRecognitionMeta;
}

export interface DiagramAnalysis {
  shapes: RecognizedShape[];
  scene?: GeometryScene;
  recognizedLabels?: string[];
  textAnnotations?: string[];
  measurements: ShapeMeasurement[];
  diagram?: DiagramSpec;
  graph?: GraphSpec;
  explanation?: string;
  summary: string;
}

export interface VisualizeResponseExtended {
  graph?: GraphSpec;
  diagram?: DiagramSpec;
  analysis?: DiagramAnalysis;
  provider?: string;
}

export interface OpenCVDebugSnapshot {
  maskDataUrl?: string;
  contourCount: number;
  contours?: Array<{ points: Array<{ x: number; y: number }>; vertexCount: number }>;
  lines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  circles?: Array<{ cx: number; cy: number; radius: number }>;
  recognizedShapes: RecognizedShape[];
  fusedShapes: RecognizedShape[];
  scene?: GeometryScene;
}
