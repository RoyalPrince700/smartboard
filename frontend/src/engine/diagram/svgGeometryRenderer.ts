import type {
  DiagramElement,
  DiagramSpec,
  GeometryScene,
  GeometryScenePoint,
  GeometrySceneShape,
  GeometryVertex,
} from '../../types/geometry';
import { leftoverNoteLabels, teachingOverlayElements } from './teachingAnnotations';

const W = 560;
const H = 360;

function el(partial: DiagramElement): DiagramElement {
  return partial;
}

function angleBetween(a: { x: number; y: number }, vertex: { x: number; y: number }, c: { x: number; y: number }): number {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: c.x - vertex.x, y: c.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
}

function scaleSceneToViewport(
  scene: GeometryScene
): {
  pointMap: Map<string, GeometryScenePoint>;
  scale: number;
  offsetX: number;
  offsetY: number;
  bounds: { x1: number; y1: number; x2: number; y2: number };
} {
  const padding = 56;
  const shapeVertices = scene.shapes?.flatMap((s) => s.vertices) ?? [];
  const allX = [
    ...scene.points.map((p) => p.x),
    ...shapeVertices.map((v) => v.x),
    ...scene.labels.map((l) => l.x),
  ];
  const allY = [
    ...scene.points.map((p) => p.y),
    ...shapeVertices.map((v) => v.y),
    ...scene.labels.map((l) => l.y),
  ];
  const bounds = scene.bounds ?? {
    x1: allX.length ? Math.min(...allX) : 0,
    y1: allY.length ? Math.min(...allY) : 0,
    x2: allX.length ? Math.max(...allX) : 1,
    y2: allY.length ? Math.max(...allY) : 1,
  };
  const sourceW = Math.max(bounds.x2 - bounds.x1, 1);
  const sourceH = Math.max(bounds.y2 - bounds.y1, 1);
  const scale = Math.min((W - padding * 2) / sourceW, (H - padding * 2) / sourceH);
  const offsetX = padding;
  const offsetY = padding;

  const pointMap = new Map<string, GeometryScenePoint>();
  for (const point of scene.points) {
    pointMap.set(point.id, {
      ...point,
      x: offsetX + (point.x - bounds.x1) * scale,
      y: offsetY + (point.y - bounds.y1) * scale,
    });
  }

  for (const shape of scene.shapes ?? []) {
    for (const vertex of shape.vertices) {
      if (!pointMap.has(vertex.id)) {
        pointMap.set(vertex.id, {
          id: vertex.id,
          x: offsetX + (vertex.x - bounds.x1) * scale,
          y: offsetY + (vertex.y - bounds.y1) * scale,
        });
      }
    }
  }

  return { pointMap, scale, offsetX, offsetY, bounds };
}

function mapPoint(
  point: { x: number; y: number },
  layout: ReturnType<typeof scaleSceneToViewport>
): { x: number; y: number } {
  return {
    x: layout.offsetX + (point.x - layout.bounds.x1) * layout.scale,
    y: layout.offsetY + (point.y - layout.bounds.y1) * layout.scale,
  };
}

function mapVertices(vertices: GeometryVertex[], bounds: { x1: number; y1: number }, scale: number, offsetX: number, offsetY: number) {
  return vertices.map((vertex) => ({
    x: offsetX + (vertex.x - bounds.x1) * scale,
    y: offsetY + (vertex.y - bounds.y1) * scale,
  }));
}

function renderShape(shape: GeometrySceneShape, layout: ReturnType<typeof scaleSceneToViewport>): DiagramElement[] {
  const { bounds, scale, offsetX, offsetY } = layout;
  const elements: DiagramElement[] = [];
  const pts = mapVertices(shape.vertices, bounds, scale, offsetX, offsetY);

  if (shape.type === 'circle' && shape.vertices.length >= 1 && shape.bounds) {
    const center = pts[0];
    const radius = ((shape.bounds.x2 - shape.bounds.x1) / 2) * scale;
    elements.push(
      el({
        type: 'circle',
        cx: center.x,
        cy: center.y,
        radius,
        color: '#1f2937',
        strokeWidth: 3,
      })
    );
    return elements;
  }

  if (shape.type === 'line' && pts.length >= 2) {
    elements.push(
      el({
        type: 'line',
        x1: pts[0].x,
        y1: pts[0].y,
        x2: pts[1].x,
        y2: pts[1].y,
        color: '#1f2937',
        strokeWidth: 3,
      })
    );
    if (pts.length >= 3) {
      elements.push(
        el({
          type: 'line',
          x1: pts[1].x,
          y1: pts[1].y,
          x2: pts[2].x,
          y2: pts[2].y,
          color: '#1f2937',
          strokeWidth: 3,
        })
      );
      const degrees = angleBetween(pts[0], pts[1], pts[2]);
      if (Math.abs(degrees - 90) <= 10) {
        const size = 16;
        elements.push(
          el({
            type: 'rectangle',
            x1: pts[1].x,
            y1: pts[1].y - size,
            width: size,
            height: size,
            color: '#1f2937',
            strokeWidth: 2,
          })
        );
      } else {
        elements.push(el({ type: 'arc', cx: pts[1].x, cy: pts[1].y, radius: 24, color: '#4f46e5' }));
      }
    }
    return elements;
  }

  if (shape.type === 'rectangle' && pts.length >= 4) {
    elements.push(
      el({
        type: 'polygon',
        points: pts,
        color: '#1f2937',
        strokeWidth: 3,
      })
    );
    return elements;
  }

  if ((shape.type === 'triangle' || shape.type === 'polygon') && pts.length >= 3) {
    elements.push(
      el({
        type: shape.type === 'triangle' ? 'triangle' : 'polygon',
        points: pts,
        color: '#1f2937',
        strokeWidth: 3,
      })
    );
    return elements;
  }

  if (shape.edges.length > 0) {
    const vertexMap = new Map(shape.vertices.map((v, i) => [v.id, pts[i]]));
    for (const edge of shape.edges) {
      const p1 = vertexMap.get(edge.from);
      const p2 = vertexMap.get(edge.to);
      if (!p1 || !p2) continue;
      elements.push(
        el({
          type: 'line',
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          color: '#1f2937',
          strokeWidth: 3,
        })
      );
    }
  }

  return elements;
}

export function renderGeometrySceneToDiagram(
  scene: GeometryScene,
  title = 'Recognized geometry'
): DiagramSpec | null {
  if ((scene.shapes?.length ?? 0) === 0 && scene.segments.length === 0) return null;

  const layout = scaleSceneToViewport(scene);
  const elements: DiagramElement[] = [];

  if (scene.shapes && scene.shapes.length > 0) {
    for (const shape of scene.shapes) {
      elements.push(...renderShape(shape, layout));
    }
    elements.push(...teachingOverlayElements(scene, layout.pointMap));
    elements.push(...leftoverNoteLabels(scene, layout.pointMap, (label) => mapPoint(label, layout)));
  } else {
    for (const segment of scene.segments) {
      const p1 = layout.pointMap.get(segment.p1);
      const p2 = layout.pointMap.get(segment.p2);
      if (!p1 || !p2) continue;
      elements.push(
        el({
          type: 'line',
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          color: '#1f2937',
          strokeWidth: 3,
        })
      );
    }
    elements.push(...teachingOverlayElements(scene, layout.pointMap));

    for (const angle of scene.angles.filter((item) => item.isMarked || item.valueDeg !== undefined)) {
      const vertex = layout.pointMap.get(angle.vertex);
      const p1 = layout.pointMap.get(scene.segments.find((s) => s.id === angle.ray1)?.p1 === angle.vertex
        ? scene.segments.find((s) => s.id === angle.ray1)!.p2
        : scene.segments.find((s) => s.id === angle.ray1)?.p1 ?? '');
      const p2 = layout.pointMap.get(scene.segments.find((s) => s.id === angle.ray2)?.p1 === angle.vertex
        ? scene.segments.find((s) => s.id === angle.ray2)!.p2
        : scene.segments.find((s) => s.id === angle.ray2)?.p1 ?? '');
      if (!vertex || !p1 || !p2) continue;
      const startAngle = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      const endAngle = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
      let delta = endAngle - startAngle;
      while (delta <= -Math.PI) delta += Math.PI * 2;
      while (delta > Math.PI) delta -= Math.PI * 2;
      elements.push(
        el({
          type: 'arc',
          cx: vertex.x,
          cy: vertex.y,
          radius: 24,
          startAngle,
          endAngle: startAngle + delta,
          color: '#4f46e5',
          strokeWidth: 2,
        })
      );
    }

    for (const segment of scene.segments) {
      if (!segment.label) continue;
      const p1 = layout.pointMap.get(segment.p1);
      const p2 = layout.pointMap.get(segment.p2);
      if (!p1 || !p2) continue;
      elements.push(
        el({
          type: 'label',
          x1: (p1.x + p2.x) / 2,
          y1: (p1.y + p2.y) / 2 - 12,
          text: segment.label,
          color: '#111827',
        })
      );
    }
  }

  const closedShape = scene.shapes?.some(
    (shape) => shape.type === 'triangle' || shape.type === 'rectangle' || shape.type === 'polygon' || shape.type === 'circle'
  );
  const hasSideLabels = scene.labels.some((l) => l.kind === 'side') || scene.segments.some((s) => s.label);
  if (!closedShape && !hasSideLabels) {
    for (const point of layout.pointMap.values()) {
      elements.push(el({ type: 'point', cx: point.x, cy: point.y, color: '#64748b' }));
    }
  }

  if (elements.length === 0) return null;

  return {
    title,
    category: 'geometry',
    width: W,
    height: H,
    description: 'Clean redraw preserving recognized proportions',
    elements,
  };
}

export function generateDiagramFromScene(
  scene: GeometryScene,
  title = 'Redrawn diagram'
): DiagramSpec | null {
  return renderGeometrySceneToDiagram(scene, title);
}
