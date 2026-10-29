import type {
  GeometryRecognitionMeta,
  RecognizedShape,
  RecognizedShapeType,
} from '../../types/geometry';

export interface RecognitionCandidate {
  type: RecognizedShapeType;
  confidence: number;
  shape: RecognizedShape;
  source: 'heuristic' | 'opencv';
}

export interface FusionResult {
  shapes: RecognizedShape[];
  meta: GeometryRecognitionMeta;
}

const STRONG_TYPES: RecognizedShapeType[] = [
  'triangle',
  'rectangle',
  'circle',
  'line',
  'polygon',
];

function normalizeType(type: RecognizedShapeType): RecognizedShapeType {
  if (type === 'freehand') return 'unknown';
  return type;
}

function typesCompatible(a: RecognizedShapeType, b: RecognizedShapeType): boolean {
  const na = normalizeType(a);
  const nb = normalizeType(b);
  if (na === nb) return true;
  if ((na === 'rectangle' && nb === 'polygon') || (na === 'polygon' && nb === 'rectangle')) return true;
  return false;
}

/**
 * Confidence fusion rules:
 * - Agreement: average of both confidences + 0.05 bonus (capped at 0.98)
 * - Disagreement: keep higher-confidence candidate, reduce by 0.12
 * - Both uncertain (<0.55): emit unknown_shape with max confidence * 0.85
 * - Single source only: use that source unchanged
 */
export function fuseRecognizedShapes(
  heuristicShapes: RecognizedShape[],
  opencvShapes: RecognizedShape[]
): FusionResult {
  const heuristic = pickPrimary(heuristicShapes, 'heuristic');
  const opencv = pickPrimary(opencvShapes, 'opencv');

  const meta: GeometryRecognitionMeta = {
    heuristic: heuristic
      ? { type: heuristic.type, confidence: heuristic.confidence }
      : undefined,
    opencv: opencv
      ? { type: opencv.type, confidence: opencv.confidence, available: true }
      : opencvShapes.length === 0
        ? { type: 'unknown', confidence: 0, available: heuristic !== undefined }
        : undefined,
  };

  if (!heuristic && !opencv) {
    return {
      shapes: [],
      meta: {
        ...meta,
        fused: { type: 'unknown', confidence: 0, agreement: false },
      },
    };
  }

  if (!heuristic && opencv) {
    meta.fused = { type: opencv.type, confidence: opencv.confidence, agreement: true };
    return { shapes: [{ ...opencv, source: 'opencv' }], meta };
  }

  if (heuristic && !opencv) {
    meta.fused = { type: heuristic.type, confidence: heuristic.confidence, agreement: true };
    return { shapes: [{ ...heuristic, source: 'heuristic' }], meta };
  }

  if (!heuristic || !opencv) {
    return { shapes: [], meta };
  }

  const agree = typesCompatible(heuristic.type, opencv.type);
  let fusedType = agree ? normalizeType(heuristic.type) : normalizeType(
    heuristic.confidence >= opencv.confidence ? heuristic.type : opencv.type
  );
  let fusedConfidence = agree
    ? Math.min(0.98, (heuristic.confidence + opencv.confidence) / 2 + 0.05)
    : Math.max(heuristic.confidence, opencv.confidence) - 0.12;

  const preferred = heuristic.confidence >= opencv.confidence ? heuristic : opencv;
  const alternate = preferred === heuristic ? opencv : heuristic;

  if (!agree && fusedConfidence < 0.55) {
    fusedType = 'unknown';
    fusedConfidence = Math.max(heuristic.confidence, opencv.confidence) * 0.85;
  }

  if (!STRONG_TYPES.includes(fusedType) || fusedConfidence < 0.52) {
    fusedType = 'unknown';
  }

  const expectedVertices =
    fusedType === 'triangle' ? 3 : fusedType === 'rectangle' ? 4 : fusedType === 'line' ? 2 : 0;

  const vertices = pickVerticesForType(preferred.vertices, alternate.vertices, expectedVertices);
  const edges = pickEdgesForVertices(preferred.edges, alternate.edges, vertices);

  const fusedShape: RecognizedShape = {
    ...preferred,
    id: `fused-${preferred.id}`,
    type: fusedType,
    confidence: Math.round(fusedConfidence * 1000) / 1000,
    vertices,
    edges,
    bounds: preferred.bounds ?? alternate.bounds,
    measurements: preferred.measurements.length ? preferred.measurements : alternate.measurements,
    source: 'fused',
  };

  meta.fused = { type: fusedType, confidence: fusedShape.confidence, agreement: agree };
  return { shapes: [fusedShape], meta };
}

function pickVerticesForType(
  preferred?: RecognizedShape['vertices'],
  alternate?: RecognizedShape['vertices'],
  expected = 0
): RecognizedShape['vertices'] {
  if (expected > 0) {
    if (preferred?.length === expected) return preferred;
    if (alternate?.length === expected) return alternate;
  }
  if (preferred && alternate) {
    if (expected > 0) {
      const closer =
        Math.abs((preferred.length ?? 0) - expected) <= Math.abs((alternate.length ?? 0) - expected)
          ? preferred
          : alternate;
      return closer;
    }
    return preferred.length >= alternate.length ? preferred : alternate;
  }
  return preferred ?? alternate;
}

function pickEdgesForVertices(
  preferred: RecognizedShape['edges'] | undefined,
  alternate: RecognizedShape['edges'] | undefined,
  vertices: RecognizedShape['vertices']
): RecognizedShape['edges'] {
  if (!vertices || vertices.length < 2) return preferred ?? alternate ?? [];
  const matches = (edges?: RecognizedShape['edges']) =>
    Boolean(edges && edges.length === (vertices.length >= 3 ? vertices.length : vertices.length - 1));
  if (matches(preferred)) return preferred;
  if (matches(alternate)) return alternate;
  return preferred && preferred.length ? preferred : alternate ?? [];
}

function pickPrimary(shapes: RecognizedShape[], source: 'heuristic' | 'opencv'): RecognizedShape | undefined {
  const primary = [...shapes]
    .filter((shape) => shape.type !== 'freehand')
    .sort((a, b) => b.confidence - a.confidence)[0];
  return primary ? { ...primary, source } : undefined;
}

export function mergeShapeLists(
  heuristicShapes: RecognizedShape[],
  opencvShapes: RecognizedShape[]
): RecognizedShape[] {
  return fuseRecognizedShapes(heuristicShapes, opencvShapes).shapes;
}
