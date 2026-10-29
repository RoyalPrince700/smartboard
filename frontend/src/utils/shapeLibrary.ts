import type {
  GeometryObject,
  Point,
  RecognitionResult,
  ShapeId,
  TriangleGeometry,
} from '../types/whiteboardGeometry';
import {
  recognizeArc,
  recognizeCircle,
  recognizeFreehand,
  recognizeGeometry,
  recognizeLine,
  recognizeSemicircle,
} from './geometryRecognition';
import { DEFAULT_RECOGNITION_CONFIG, type RecognitionConfig } from './recognitionConfig';
import { recognizeTriangle } from './triangleRecognition';
import {
  renderArc,
  renderCircle,
  renderFreehand,
  renderLine,
  renderPolygon,
  renderSemicircle,
  renderTriangle,
  type ShapeRenderStyle,
} from './shapeRenderers';

export type { ShapeRenderStyle };

export interface ShapeDefinition {
  id: ShapeId;
  name: string;
  category: 'triangle' | 'circle' | 'arc' | 'line' | 'freehand';
  recognize: (points: Point[], config?: RecognitionConfig) => RecognitionResult | null;
  render: (ctx: CanvasRenderingContext2D, geometry: GeometryObject, style: ShapeRenderStyle) => void;
  matches: (geometry: GeometryObject) => boolean;
}

function triangleMatches(classification: TriangleGeometry['classification']) {
  return (geometry: GeometryObject) =>
    geometry.type === 'triangle' && geometry.classification === classification;
}

function renderIfTriangle(
  ctx: CanvasRenderingContext2D,
  geometry: GeometryObject,
  style: ShapeRenderStyle
) {
  if (geometry.type === 'triangle') renderTriangle(ctx, geometry, style);
}

function classifiedTriangle(
  classification: TriangleGeometry['classification']
): ShapeDefinition['recognize'] {
  return (points, config = DEFAULT_RECOGNITION_CONFIG) => {
    const result = recognizeTriangle(points, config);
    if (result?.geometry.type === 'triangle' && result.geometry.classification === classification) {
      return result;
    }
    return null;
  };
}

export const SHAPE_LIBRARY: ShapeDefinition[] = [
  {
    id: 'CIRCLE',
    name: 'Circle',
    category: 'circle',
    recognize: recognizeCircle,
    render: (ctx, geometry, style) => {
      if (geometry.type === 'circle') renderCircle(ctx, geometry, style);
    },
    matches: (geometry) => geometry.type === 'circle',
  },
  {
    id: 'SEMICIRCLE',
    name: 'Semicircle',
    category: 'arc',
    recognize: recognizeSemicircle,
    render: (ctx, geometry, style) => {
      if (geometry.type === 'semicircle') renderSemicircle(ctx, geometry, style);
    },
    matches: (geometry) => geometry.type === 'semicircle',
  },
  {
    id: 'ARC',
    name: 'Circular arc',
    category: 'arc',
    recognize: recognizeArc,
    render: (ctx, geometry, style) => {
      if (geometry.type === 'arc') renderArc(ctx, geometry, style);
    },
    matches: (geometry) => geometry.type === 'arc',
  },
  {
    id: 'EQUILATERAL_TRIANGLE',
    name: 'Equilateral triangle',
    category: 'triangle',
    recognize: classifiedTriangle('equilateral'),
    render: renderIfTriangle,
    matches: triangleMatches('equilateral'),
  },
  {
    id: 'ISOSCELES_TRIANGLE',
    name: 'Isosceles triangle',
    category: 'triangle',
    recognize: classifiedTriangle('isosceles'),
    render: renderIfTriangle,
    matches: triangleMatches('isosceles'),
  },
  {
    id: 'RIGHT_TRIANGLE',
    name: 'Right triangle',
    category: 'triangle',
    recognize: classifiedTriangle('right'),
    render: renderIfTriangle,
    matches: triangleMatches('right'),
  },
  {
    id: 'TRIANGLE',
    name: 'Triangle',
    category: 'triangle',
    recognize: (points, config = DEFAULT_RECOGNITION_CONFIG) =>
      recognizeTriangle(points, config),
    render: renderIfTriangle,
    matches: (geometry) => geometry.type === 'triangle' && geometry.classification === 'general',
  },
  {
    id: 'LINE',
    name: 'Line',
    category: 'line',
    recognize: recognizeLine,
    render: (ctx, geometry, style) => {
      if (geometry.type === 'line') renderLine(ctx, geometry, style);
    },
    matches: (geometry) => geometry.type === 'line',
  },
  {
    id: 'FREEHAND',
    name: 'Freehand',
    category: 'freehand',
    recognize: recognizeFreehand,
    render: (ctx, geometry, style) => {
      if (geometry.type === 'freehand') renderFreehand(ctx, geometry, style);
    },
    matches: (geometry) => geometry.type === 'freehand',
  },
];

const SHAPE_BY_ID = new Map(SHAPE_LIBRARY.map((shape) => [shape.id, shape]));

export function getShapeDefinition(id: ShapeId): ShapeDefinition {
  return SHAPE_BY_ID.get(id) ?? SHAPE_BY_ID.get('FREEHAND')!;
}

export function shapeIdFor(geometry: GeometryObject): ShapeId {
  const match = SHAPE_LIBRARY.find((shape) => shape.matches(geometry));
  return match?.id ?? 'FREEHAND';
}

export function renderGeometry(
  ctx: CanvasRenderingContext2D,
  geometry: GeometryObject,
  style: ShapeRenderStyle
): void {
  if (geometry.type === 'polygon') {
    renderPolygon(ctx, geometry, style);
    return;
  }

  getShapeDefinition(shapeIdFor(geometry)).render(ctx, geometry, style);
}

export { recognizeGeometry };
