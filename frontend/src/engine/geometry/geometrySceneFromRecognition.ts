import type {
  GeometryRecognitionMeta,
  GeometryScene,
  GeometrySceneAngle,
  GeometryScenePoint,
  GeometrySceneSegment,
  GeometrySceneShape,
  GeometryVertex,
  RecognizedShape,
} from '../../types/geometry';
import type { Stroke } from '../../types/stroke';
import { buildGeometryScene, segmentGeometryStrokes } from './sceneBuilder';
import { rebuildSceneAngles } from './sceneAnnotations';

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angleDeg(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return ((deg % 180) + 180) % 180;
}

function interiorDegrees(
  prev: { x: number; y: number },
  vertex: { x: number; y: number },
  next: { x: number; y: number }
): number {
  const v1 = { x: prev.x - vertex.x, y: prev.y - vertex.y };
  const v2 = { x: next.x - vertex.x, y: next.y - vertex.y };
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function upsertPoint(points: GeometryScenePoint[], vertex: GeometryVertex): string {
  const existing = points.find((p) => dist(p, vertex) <= 20);
  if (existing) return existing.id;
  points.push({ id: vertex.id, x: Math.round(vertex.x), y: Math.round(vertex.y) });
  return vertex.id;
}

function shapeToSceneShape(shape: RecognizedShape, index: number): GeometrySceneShape | null {
  if (!shape.vertices || shape.vertices.length < 2) return null;
  return {
    id: shape.id || `shape_${index + 1}`,
    type: shape.type,
    confidence: shape.confidence,
    vertices: shape.vertices,
    edges: shape.edges ?? [],
    bounds: shape.bounds,
    source: shape.source,
  };
}

function segmentsFromShape(shape: GeometrySceneShape, points: GeometryScenePoint[]): GeometrySceneSegment[] {
  const segments: GeometrySceneSegment[] = [];
  const vertexMap = new Map(shape.vertices.map((v) => [v.id, v]));

  if (shape.edges.length > 0) {
    shape.edges.forEach((edge, index) => {
      const p1 = vertexMap.get(edge.from);
      const p2 = vertexMap.get(edge.to);
      if (!p1 || !p2) return;
      const id1 = upsertPoint(points, p1);
      const id2 = upsertPoint(points, p2);
      segments.push({
        id: `seg-${shape.id}-${index + 1}`,
        p1: id1,
        p2: id2,
        length: Math.round(dist(p1, p2) * 100) / 100,
        angleDeg: Math.round(angleDeg(p1, p2) * 100) / 100,
        kind: shape.type === 'line' ? 'line' : 'side',
      });
    });
    return segments;
  }

  if (shape.type === 'line' && shape.vertices.length >= 2) {
    const [a, b] = shape.vertices;
    const id1 = upsertPoint(points, a);
    const id2 = upsertPoint(points, b);
    segments.push({
      id: `seg-${shape.id}-1`,
      p1: id1,
      p2: id2,
      length: Math.round(dist(a, b) * 100) / 100,
      angleDeg: Math.round(angleDeg(a, b) * 100) / 100,
      kind: 'line',
    });
  }

  return segments;
}

export function enrichGeometryScene(
  baseScene: GeometryScene,
  shapes: RecognizedShape[],
  recognition?: GeometryRecognitionMeta
): GeometryScene {
  const sceneShapes = shapes
    .map((shape, index) => shapeToSceneShape(shape, index))
    .filter((shape): shape is GeometrySceneShape => Boolean(shape));

  const points = [...baseScene.points];
  const shapeSegments = sceneShapes.flatMap((shape) => segmentsFromShape(shape, points));
  const closedShape = sceneShapes.some(
    (shape) => shape.type === 'triangle' || shape.type === 'rectangle' || shape.type === 'polygon'
  );
  const segments = closedShape && shapeSegments.length > 0
    ? dedupeSegments(shapeSegments)
    : shapeSegments.length >= baseScene.segments.length
      ? dedupeSegments(shapeSegments)
      : baseScene.segments;

  const bounds = computeBounds(points, sceneShapes, baseScene.segments.length ? baseScene.bounds : undefined);

  let scene: GeometryScene = {
    ...baseScene,
    type: 'geometry_scene',
    points,
    segments,
    shapes: sceneShapes.length > 0 ? sceneShapes : baseScene.shapes,
    bounds,
    recognition,
    relations: [
      ...baseScene.relations.filter((relation) => relation.type !== 'parallel' && relation.type !== 'equalLength'),
      ...lengthRelations(segments, closedShape && (sceneShapes[0]?.type === 'triangle')),
    ],
  };

  scene = {
    ...scene,
    angles: anglesFromClosedShapes(scene),
  };

  return scene;
}

function lengthRelations(segments: GeometrySceneSegment[], skipParallel: boolean): GeometryScene['relations'] {
  const relations: GeometryScene['relations'] = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      const share = a.p1 === b.p1 || a.p1 === b.p2 || a.p2 === b.p1 || a.p2 === b.p2;
      if (!skipParallel && !share) {
        const diff = Math.abs(a.angleDeg - b.angleDeg) % 180;
        const angleGap = Math.min(diff, 180 - diff);
        if (angleGap <= 8) {
          relations.push({ type: 'parallel', targetIds: [a.id, b.id], confidence: 0.82 });
        }
      }
      const longer = Math.max(a.length, b.length, 1);
      if (Math.abs(a.length - b.length) / longer <= 0.1) {
        relations.push({ type: 'equalLength', targetIds: [a.id, b.id], confidence: 0.58 });
      }
    }
  }
  return relations;
}

function dedupeSegments(segments: GeometrySceneSegment[]): GeometrySceneSegment[] {
  const kept: GeometrySceneSegment[] = [];
  for (const segment of segments) {
    const duplicate = kept.find(
      (existing) =>
        (existing.p1 === segment.p1 && existing.p2 === segment.p2) ||
        (existing.p1 === segment.p2 && existing.p2 === segment.p1)
    );
    if (!duplicate) kept.push(segment);
  }
  return kept;
}

function anglesFromClosedShapes(scene: GeometryScene): GeometrySceneAngle[] {
  const shapes = scene.shapes ?? [];
  const computed: GeometrySceneAngle[] = [];

  for (const shape of shapes) {
    if (shape.vertices.length < 3) continue;
    const verts = shape.vertices;
    for (let i = 0; i < verts.length; i += 1) {
      const prev = verts[(i + verts.length - 1) % verts.length];
      const vertex = verts[i];
      const next = verts[(i + 1) % verts.length];
      const degrees = Math.round(interiorDegrees(prev, vertex, next) * 10) / 10;
      const attached = scene.segments.filter((segment) => segment.p1 === vertex.id || segment.p2 === vertex.id);
      computed.push({
        id: `angle-${vertex.id}`,
        vertex: vertex.id,
        ray1: attached[0]?.id ?? `${shape.id}-ray-a-${i}`,
        ray2: attached[1]?.id ?? `${shape.id}-ray-b-${i}`,
        valueDeg: degrees,
        isMarked: false,
      });
    }
  }

  if (computed.length > 0) return computed;
  return scene.angles;
}

export function finalizeGeometryScene(scene: GeometryScene, strokes: Stroke[]): GeometryScene {
  const segmented = segmentGeometryStrokes(strokes);
  return rebuildSceneAngles(scene, segmented.angleMarkStrokes);
}

function computeBounds(
  points: GeometryScenePoint[],
  shapes: GeometrySceneShape[],
  fallback?: GeometryScene['bounds']
): GeometryScene['bounds'] {
  const allVertices = shapes.flatMap((shape) => shape.vertices);
  const coords = [...points, ...allVertices.map((v) => ({ x: v.x, y: v.y }))];
  if (coords.length === 0) return fallback;
  const xs = coords.map((p) => p.x);
  const ys = coords.map((p) => p.y);
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

export function buildEnrichedGeometryScene(
  strokes: Stroke[],
  shapes: RecognizedShape[],
  recognizedLabelText = '',
  recognition?: GeometryRecognitionMeta
): GeometryScene {
  const baseScene = buildGeometryScene(strokes, recognizedLabelText);
  const enriched = enrichGeometryScene(baseScene, shapes, recognition);
  return finalizeGeometryScene(enriched, strokes);
}

export function sceneToAgentPayload(scene: GeometryScene) {
  return {
    subject: 'mathematics',
    topic: 'geometry',
    scene: {
      type: scene.type ?? 'geometry_scene',
      shapes: scene.shapes ?? [],
      points: scene.points,
      segments: scene.segments,
      angles: scene.angles,
      annotations: scene.labels.map((label) => ({
        type: label.kind,
        value: label.text,
        attachedTo: label.targetId,
      })),
      relations: scene.relations,
      recognition: scene.recognition,
    },
  };
}
