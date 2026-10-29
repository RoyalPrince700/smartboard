export interface Point {
  x: number;
  y: number;
}

export interface RawStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export type ShapeId =
  | 'TRIANGLE'
  | 'EQUILATERAL_TRIANGLE'
  | 'ISOSCELES_TRIANGLE'
  | 'RIGHT_TRIANGLE'
  | 'CIRCLE'
  | 'SEMICIRCLE'
  | 'ARC'
  | 'FREEHAND'
  | 'LINE';

export type TriangleClassification = 'general' | 'equilateral' | 'isosceles' | 'right';

export type VertexIndex = 0 | 1 | 2;

export interface LineGeometry {
  type: 'line';
  start: Point;
  end: Point;
  angle: number;
  confidence: number;
}

export interface CircleGeometry {
  type: 'circle';
  center: Point;
  radius: number;
  confidence: number;
}

export interface ArcGeometry {
  type: 'arc';
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
  confidence: number;
}

export interface SemicircleGeometry {
  type: 'semicircle';
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
  confidence: number;
}

export interface TriangleGeometry {
  type: 'triangle';
  vertices: [Point, Point, Point];
  classification: TriangleClassification;
  /** Centroid of the reconstructed triangle. */
  center: Point;
  /** Mean side length after constraints are applied. */
  size: number;
  /** Orientation of vertex 0 relative to the center, in radians. */
  rotation: number;
  /** Apex (vertex opposite the base) when isosceles or equilateral. */
  apexIndex?: VertexIndex;
  /** Right-angle vertex. Enables later hypotenuse / opposite / adjacent lookup. */
  rightVertexIndex?: VertexIndex;
  /** Endpoints of the hypotenuse when the triangle is right-angled. */
  hypotenuse?: { from: VertexIndex; to: VertexIndex };
  sideLengths: [number, number, number];
  /** Interior angles in radians, matching `vertices`. */
  angles: [number, number, number];
  confidence: number;
}

export interface PolygonGeometry {
  type: 'polygon';
  vertices: Point[];
  closed: boolean;
  confidence: number;
}

export interface FreehandGeometry {
  type: 'freehand';
  points: Point[];
  confidence: number;
}

export type GeometryObject =
  | TriangleGeometry
  | CircleGeometry
  | SemicircleGeometry
  | ArcGeometry
  | LineGeometry
  | PolygonGeometry
  | FreehandGeometry;

export interface RecognitionResult {
  geometry: GeometryObject;
  confidence: number;
}

export interface RecognizedGeometry {
  id: string;
  rawStrokeId: string;
  shapeId: ShapeId;
  geometry: GeometryObject;
  confidence: number;
  color: string;
  width: number;
}

export interface WhiteboardScene {
  rawStrokes: RawStroke[];
  geometryObjects: RecognizedGeometry[];
}

/** Reserved for future relationship constraints (intersection, parallel, etc.) */
export interface GeometryRelationship {
  type:
    | 'intersects'
    | 'perpendicular'
    | 'parallel'
    | 'point-on-line'
    | 'vertex-of'
    | 'angle-between';
  objectIds: string[];
  metadata?: Record<string, number | string | boolean>;
}
