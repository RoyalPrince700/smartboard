import type { DiagramSpec } from '../../types/geometry';
import {
  generateCanonicalGeometryDiagram,
  type GeometryDiagramInput,
} from './canonicalGeometryDiagram';

function parseNumberList(raw?: string): number[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function generateCanonicalGeometryDiagramFromText(text: string): DiagramSpec | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const shape = /shape\s*=\s*([a-z_]+)/i.exec(trimmed)?.[1];
  const values = parseNumberList(/values\s*=\s*([0-9.,\s]+)/i.exec(trimmed)?.[1]);
  const unit = /unit\s*=\s*([a-z]+)/i.exec(trimmed)?.[1];
  const angleLabel = /angleLabel\s*=\s*([^\s]+)/i.exec(trimmed)?.[1];
  const knownAngles = parseNumberList(/angles\s*=\s*([0-9.,\s]+)/i.exec(trimmed)?.[1]);
  const isTrig =
    /\[trigonometry\]/i.test(trimmed) ||
    /find\s*=\s*unknown_angle/i.test(trimmed) ||
    /(?:θ|theta)/i.test(trimmed);
  const looksGeometric =
    Boolean(shape) ||
    /\[geometry\]/i.test(trimmed) ||
    isTrig ||
    /\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b/i.test(trimmed);

  if (!looksGeometric) return null;

  const inferredShape =
    shape ||
    (/\bcircle\b/i.test(trimmed) ? 'circle' : undefined) ||
    (/\bsquare\b/i.test(trimmed) ? 'square' : undefined) ||
    (/\brectangle\b/i.test(trimmed) ? 'rectangle' : undefined) ||
    (/\btriangle\b/i.test(trimmed) || isTrig ? 'triangle' : undefined);

  const input: GeometryDiagramInput = {
    shapeType: inferredShape,
    problemType: isTrig ? 'trigonometry' : 'geometry',
    trigTask: isTrig ? 'find_angle_from_sides' : undefined,
    sides: values,
    unit,
    angleLabel,
    knownAngles,
    isRightTriangle: isTrig || /right/i.test(trimmed),
    opposite: isTrig ? values[0] : undefined,
    adjacent: isTrig ? values[1] : undefined,
    length: inferredShape === 'rectangle' || inferredShape === 'square' ? values[0] : undefined,
    width: inferredShape === 'rectangle' ? values[1] : undefined,
    radius: inferredShape === 'circle' ? values[0] : undefined,
  };

  return generateCanonicalGeometryDiagram(input);
}

export { generateCanonicalGeometryDiagram };
export type { GeometryDiagramInput };
