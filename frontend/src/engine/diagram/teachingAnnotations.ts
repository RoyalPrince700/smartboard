import type { DiagramElement, GeometryScene, GeometryScenePoint } from '../../types/geometry';
import { isUsefulGeometryLabel } from '../geometry/geometryLabelOcr';

interface Vec {
  x: number;
  y: number;
}

function el(partial: DiagramElement): DiagramElement {
  return partial;
}

function dist(a: Vec, b: Vec): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalize(v: Vec): Vec {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function add(a: Vec, b: Vec, scale = 1): Vec {
  return { x: a.x + b.x * scale, y: a.y + b.y * scale };
}

function interiorDegrees(prev: Vec, vertex: Vec, next: Vec): number {
  const v1 = { x: prev.x - vertex.x, y: prev.y - vertex.y };
  const v2 = { x: next.x - vertex.x, y: next.y - vertex.y };
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function interiorArc(vertex: Vec, prev: Vec, next: Vec): { startAngle: number; endAngle: number } {
  const a1 = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
  const a2 = Math.atan2(next.y - vertex.y, next.x - vertex.x);
  let delta = a2 - a1;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  return { startAngle: a1, endAngle: a1 + delta };
}

function polygonCentroid(points: Vec[]): Vec {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function outwardMidpoint(a: Vec, b: Vec, centroid: Vec, offset: number): Vec {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const edge = { x: b.x - a.x, y: b.y - a.y };
  const normal = normalize({ x: -edge.y, y: edge.x });
  const toShape = { x: centroid.x - mid.x, y: centroid.y - mid.y };
  const sign = normal.x * toShape.x + normal.y * toShape.y >= 0 ? -1 : 1;
  return add(mid, normal, offset * sign);
}

function rightAngleSquare(vertex: Vec, prev: Vec, next: Vec, size: number): Vec[] {
  const u = normalize({ x: prev.x - vertex.x, y: prev.y - vertex.y });
  const v = normalize({ x: next.x - vertex.x, y: next.y - vertex.y });
  const a = add(vertex, u, size);
  const c = add(vertex, v, size);
  const b = { x: a.x + v.x * size, y: a.y + v.y * size };
  return [a, b, c];
}

function lookupPoint(id: string, pointMap: Map<string, GeometryScenePoint>): Vec | undefined {
  const point = pointMap.get(id);
  return point ? { x: point.x, y: point.y } : undefined;
}

/**
 * Textbook-style overlays for any recognized polygon: right-angle squares,
 * interior angle arcs, and side numbers placed outside the matching edge.
 */
export function teachingOverlayElements(
  scene: GeometryScene,
  pointMap: Map<string, GeometryScenePoint>
): DiagramElement[] {
  const elements: DiagramElement[] = [];
  const shapes = scene.shapes ?? [];

  for (const shape of shapes) {
    if (shape.vertices.length < 3) continue;
    const pts = shape.vertices
      .map((vertex) => lookupPoint(vertex.id, pointMap) ?? { x: vertex.x, y: vertex.y });
    const centroid = polygonCentroid(pts);
    const minSide = Math.min(
      ...pts.map((p, i) => dist(p, pts[(i + 1) % pts.length]))
    );
    const arcRadius = Math.max(18, Math.min(36, minSide * 0.18));
    const squareSize = Math.max(12, Math.min(22, minSide * 0.12));

    const userRight = new Set(
      scene.angles.filter((angle) => angle.mark === 'right').map((angle) => angle.vertex)
    );
    const degreesByVertex = pts.map((point, i) => {
      const prev = pts[(i + pts.length - 1) % pts.length];
      const next = pts[(i + 1) % pts.length];
      return { id: shape.vertices[i].id, degrees: interiorDegrees(prev, point, next) };
    });
    let squareVertexId: string | undefined;
    if (userRight.size > 0) {
      squareVertexId = degreesByVertex
        .filter((item) => userRight.has(item.id))
        .sort((a, b) => Math.abs(a.degrees - 90) - Math.abs(b.degrees - 90))[0]?.id;
    }
    if (!squareVertexId) {
      const closest = [...degreesByVertex].sort(
        (a, b) => Math.abs(a.degrees - 90) - Math.abs(b.degrees - 90)
      )[0];
      if (closest && Math.abs(closest.degrees - 90) <= 10) squareVertexId = closest.id;
    }

    for (let i = 0; i < pts.length; i += 1) {
      const prev = pts[(i + pts.length - 1) % pts.length];
      const vertex = pts[i];
      const next = pts[(i + 1) % pts.length];
      const vertexId = shape.vertices[i].id;
      const sceneAngle = scene.angles.find((angle) => angle.vertex === vertexId);
      const angleLabel = scene.labels.find(
        (label) =>
          label.kind === 'angle' &&
          isUsefulGeometryLabel(label.text) &&
          (label.targetId === vertexId || label.targetId === sceneAngle?.id)
      );
      const drawSquare = vertexId === squareVertexId;
      const drawArc = !drawSquare && (sceneAngle?.mark === 'arc' || Boolean(angleLabel) || pts.length <= 4);

      if (drawSquare) {
        const square = rightAngleSquare(vertex, prev, next, squareSize);
        elements.push(
          el({
            type: 'line',
            x1: square[0].x,
            y1: square[0].y,
            x2: square[1].x,
            y2: square[1].y,
            color: '#1f2937',
            strokeWidth: 2,
          }),
          el({
            type: 'line',
            x1: square[1].x,
            y1: square[1].y,
            x2: square[2].x,
            y2: square[2].y,
            color: '#1f2937',
            strokeWidth: 2,
          })
        );
      } else if (drawArc) {
        const arc = interiorArc(vertex, prev, next);
        elements.push(
          el({
            type: 'arc',
            cx: vertex.x,
            cy: vertex.y,
            radius: arcRadius,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
            color: '#4f46e5',
            strokeWidth: 2,
          })
        );
        if (angleLabel) {
          const bisector = normalize({
            x: centroid.x - vertex.x,
            y: centroid.y - vertex.y,
          });
          elements.push(
            el({
              type: 'label',
              x1: vertex.x + bisector.x * (arcRadius + 14),
              y1: vertex.y + bisector.y * (arcRadius + 14),
              text: angleLabel.text,
              color: '#4f46e5',
            })
          );
        }
      }
    }

    const usedLabelIds = new Set<string>();
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const fromId = shape.vertices[i].id;
      const toId = shape.vertices[(i + 1) % pts.length].id;
      const segment = scene.segments.find(
        (item) =>
          (item.p1 === fromId && item.p2 === toId) || (item.p1 === toId && item.p2 === fromId)
      );
      const targeted = scene.labels.find(
        (item) =>
          item.kind === 'side' &&
          isUsefulGeometryLabel(item.text) &&
          item.targetId === segment?.id &&
          !usedLabelIds.has(item.id)
      );
      const label =
        (segment?.label && isUsefulGeometryLabel(segment.label) ? segment.label : undefined) ||
        targeted?.text;

      if (!label) continue;
      if (targeted) usedLabelIds.add(targeted.id);
      const pos = outwardMidpoint(a, b, centroid, 22);
      elements.push(
        el({
          type: 'label',
          x1: pos.x,
          y1: pos.y,
          text: label,
          color: '#111827',
        })
      );
    }
  }

  return elements;
}

export function leftoverNoteLabels(
  scene: GeometryScene,
  pointMap: Map<string, GeometryScenePoint>,
  mapPoint: (label: { x: number; y: number }) => Vec
): DiagramElement[] {
  const overlayed = new Set(
    scene.labels
      .filter((label) => label.kind === 'side' || label.kind === 'angle')
      .map((label) => label.id)
  );

  return scene.labels
    .filter((label) => isUsefulGeometryLabel(label.text) && !overlayed.has(label.id) && label.kind === 'note')
    .map((label) => {
      const mapped = label.targetId && pointMap.has(label.targetId)
        ? pointMap.get(label.targetId)!
        : mapPoint(label);
      return el({
        type: 'label',
        x1: mapped.x,
        y1: mapped.y,
        text: label.text,
        color: '#111827',
      });
    });
}
