import type {
  ArcGeometry,
  CircleGeometry,
  FreehandGeometry,
  GeometryObject,
  LineGeometry,
  Point,
  PolygonGeometry,
  SemicircleGeometry,
  TriangleGeometry,
} from '../types/whiteboardGeometry';

export interface ShapeRenderStyle {
  color: string;
  width: number;
}

function applyStrokeStyle(ctx: CanvasRenderingContext2D, style: ShapeRenderStyle): void {
  ctx.strokeStyle = style.color;
  ctx.fillStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number
): void {
  if (points.length === 0) return;

  applyStrokeStyle(ctx, { color, width });

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

export function renderLine(
  ctx: CanvasRenderingContext2D,
  geometry: LineGeometry,
  style: ShapeRenderStyle
): void {
  applyStrokeStyle(ctx, style);
  ctx.beginPath();
  ctx.moveTo(geometry.start.x, geometry.start.y);
  ctx.lineTo(geometry.end.x, geometry.end.y);
  ctx.stroke();
}

export function renderCircle(
  ctx: CanvasRenderingContext2D,
  geometry: CircleGeometry,
  style: ShapeRenderStyle
): void {
  applyStrokeStyle(ctx, style);
  ctx.beginPath();
  ctx.arc(geometry.center.x, geometry.center.y, geometry.radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function renderArc(
  ctx: CanvasRenderingContext2D,
  geometry: ArcGeometry,
  style: ShapeRenderStyle
): void {
  applyStrokeStyle(ctx, style);
  ctx.beginPath();
  ctx.arc(
    geometry.center.x,
    geometry.center.y,
    geometry.radius,
    geometry.startAngle,
    geometry.endAngle,
    !geometry.clockwise
  );
  ctx.stroke();
}

export function renderSemicircle(
  ctx: CanvasRenderingContext2D,
  geometry: SemicircleGeometry,
  style: ShapeRenderStyle
): void {
  applyStrokeStyle(ctx, style);
  const startX = geometry.center.x + Math.cos(geometry.startAngle) * geometry.radius;
  const startY = geometry.center.y + Math.sin(geometry.startAngle) * geometry.radius;

  ctx.beginPath();
  ctx.arc(
    geometry.center.x,
    geometry.center.y,
    geometry.radius,
    geometry.startAngle,
    geometry.endAngle,
    !geometry.clockwise
  );
  ctx.lineTo(startX, startY);
  ctx.stroke();
}

export function renderTriangle(
  ctx: CanvasRenderingContext2D,
  geometry: TriangleGeometry,
  style: ShapeRenderStyle
): void {
  applyStrokeStyle(ctx, style);
  const [a, b, c] = geometry.vertices;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.stroke();
}

export function renderPolygon(
  ctx: CanvasRenderingContext2D,
  geometry: PolygonGeometry,
  style: ShapeRenderStyle
): void {
  if (geometry.vertices.length === 0) return;
  applyStrokeStyle(ctx, style);
  ctx.beginPath();
  ctx.moveTo(geometry.vertices[0].x, geometry.vertices[0].y);
  for (let i = 1; i < geometry.vertices.length; i += 1) {
    ctx.lineTo(geometry.vertices[i].x, geometry.vertices[i].y);
  }
  if (geometry.closed) ctx.closePath();
  ctx.stroke();
}

export function renderFreehand(
  ctx: CanvasRenderingContext2D,
  geometry: FreehandGeometry,
  style: ShapeRenderStyle
): void {
  strokePolyline(ctx, geometry.points, style.color, style.width);
}

export function renderGeometryObject(
  ctx: CanvasRenderingContext2D,
  geometry: GeometryObject,
  color: string,
  width: number
): void {
  const style = { color, width };

  switch (geometry.type) {
    case 'line':
      renderLine(ctx, geometry, style);
      break;
    case 'circle':
      renderCircle(ctx, geometry, style);
      break;
    case 'arc':
      renderArc(ctx, geometry, style);
      break;
    case 'semicircle':
      renderSemicircle(ctx, geometry, style);
      break;
    case 'triangle':
      renderTriangle(ctx, geometry, style);
      break;
    case 'polygon':
      renderPolygon(ctx, geometry, style);
      break;
    case 'freehand':
      renderFreehand(ctx, geometry, style);
      break;
    default:
      break;
  }
}
