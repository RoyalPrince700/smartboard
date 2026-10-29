/**
 * Parses handwritten or typed geometry problems into structured givens.
 * Accepts natural language and the board capture format:
 *   [geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse
 */

import { GeometryFind, GeometryShape, ParsedGeometryProblem } from '../types';

const SHAPE_WORDS: Array<{ pattern: RegExp; shape: GeometryShape }> = [
  { pattern: /\btriangles?\b|\bpythagoras\b|\bpythagorean\b|\bhypotenuse\b/i, shape: 'triangle' },
  { pattern: /\bsquares?\b/i, shape: 'square' },
  { pattern: /\brectangles?\b|\boblong\b/i, shape: 'rectangle' },
  { pattern: /\bcircles?\b|\bradius\b|\bdiameter\b|\bcircumference\b/i, shape: 'circle' },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseNumberList(raw?: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map(round2);
}

function firstMatch(input: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(input);
  return match?.[1]?.trim();
}

function detectShape(input: string): GeometryShape {
  const structured = firstMatch(input, /shape\s*=\s*([a-z_]+)/i);
  if (
    structured === 'triangle' ||
    structured === 'rectangle' ||
    structured === 'square' ||
    structured === 'circle' ||
    structured === 'line' ||
    structured === 'angle_diagram'
  ) {
    return structured;
  }

  for (const { pattern, shape } of SHAPE_WORDS) {
    if (pattern.test(input)) return shape;
  }

  return 'unknown';
}

function detectFind(input: string): GeometryFind {
  const structured = firstMatch(input, /find\s*=\s*([a-z_]+)/i)?.toLowerCase();
  if (
    structured === 'area' ||
    structured === 'perimeter' ||
    structured === 'circumference' ||
    structured === 'hypotenuse' ||
    structured === 'missing_side' ||
    structured === 'unknown_angle' ||
    structured === 'all'
  ) {
    return structured;
  }

  if (/\bcircumference\b|\bperimet(?:er|re)\s+of\s+(?:the\s+)?circle\b/i.test(input)) return 'circumference';
  if (/\bhypotenuse\b|\bfind\s+c\b/i.test(input)) return 'hypotenuse';
  if (/\bmissing\s+side\b|\bfind\s+(?:the\s+)?side\b/i.test(input)) return 'missing_side';
  if (/\bperimeter\b|\bperimetre\b/i.test(input)) return 'perimeter';
  if (/\barea\b/i.test(input)) return 'area';
  return 'all';
}

function detectUnit(input: string): string {
  const structured = firstMatch(input, /unit\s*=\s*([a-z²³2]+)/i);
  if (structured) return structured.replace('2', '²');
  const fromValue = firstMatch(input, /\d+(?:\.\d+)?\s*(cm|mm|m)\b/i);
  return (fromValue ?? 'cm').toLowerCase();
}

function extractStructuredNumber(input: string, key: string): number {
  const match = new RegExp(`\\b${key}\\s*=\\s*([0-9]+)`, 'i').exec(input);
  return match ? Number(match[1]) : 0;
}

function extractKeyedNumber(input: string, keys: string[]): number | undefined {
  for (const key of keys) {
    const match = new RegExp(`\\b${key}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i').exec(input);
    if (match) return round2(Number(match[1]));
  }
  return undefined;
}

function extractLabeledMeasurements(input: string): {
  sides: number[];
  base?: number;
  height?: number;
  length?: number;
  width?: number;
  radius?: number;
  diameter?: number;
} {
  const values = parseNumberList(firstMatch(input, /values\s*=\s*([0-9.,\s]+)/i));
  const sides = parseNumberList(firstMatch(input, /sides\s*=\s*([0-9.,\s]+)/i));

  const radius = extractKeyedNumber(input, ['radius', 'r']) ?? (() => {
    const match = /\bradius\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();
  const diameter = extractKeyedNumber(input, ['diameter', 'd']) ?? (() => {
    const match = /\bdiameter\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();
  const base = extractKeyedNumber(input, ['base']) ?? (() => {
    const match = /\bbase\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();
  const height = extractKeyedNumber(input, ['height', 'h']) ?? (() => {
    const match = /\bheight\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();
  const length = extractKeyedNumber(input, ['length', 'l']) ?? (() => {
    const match = /\blength\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();
  const width = extractKeyedNumber(input, ['width', 'breadth', 'w']) ?? (() => {
    const match = /\b(?:width|breadth)\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i.exec(input);
    return match ? round2(Number(match[1])) : undefined;
  })();

  const byPair = /([0-9]+(?:\.[0-9]+)?)\s*(?:cm|mm|m)?\s*(?:by|×|x)\s*([0-9]+(?:\.[0-9]+)?)/i.exec(input);
  const pair = byPair ? [round2(Number(byPair[1])), round2(Number(byPair[2]))] : [];

  const labeledSides: number[] = [];
  const sidePattern = /\b(?:AB|BC|CA|AC|side)\s*=\s*([0-9]+(?:\.[0-9]+)?)/gi;
  let sideMatch: RegExpExecArray | null;
  while ((sideMatch = sidePattern.exec(input)) !== null) {
    labeledSides.push(round2(Number(sideMatch[1])));
  }

  const unitNumbers = [...input.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*(?:cm|mm|m)\b/gi)].map((m) =>
    round2(Number(m[1]))
  );

  const pythagorasSides = [
    extractKeyedNumber(input, ['a']),
    extractKeyedNumber(input, ['b']),
    extractKeyedNumber(input, ['c']),
  ].filter((n): n is number => n !== undefined);

  const mergedSides = [
    ...sides,
    ...values,
    ...labeledSides,
    ...pythagorasSides,
    ...unitNumbers,
  ];

  const uniqueSides = [...new Set(mergedSides.filter((n) => n > 0))];

  return {
    sides: uniqueSides,
    base,
    height,
    length: length ?? pair[0],
    width: width ?? pair[1],
    radius,
    diameter,
  };
}

function looksLikeGeometry(input: string): boolean {
  if (/\[geometry\]/i.test(input)) return true;
  if (SHAPE_WORDS.some(({ pattern }) => pattern.test(input))) return true;
  return /\barea of\b|\bperimeter\b|\bperimetre\b|\bfind the area\b/i.test(input);
}

function inferRightTriangle(input: string, sides: number[]): boolean {
  if (/\bright(?:[-\s]?angled)?\b|\b90\s*°|\bpythagoras\b|\bhypotenuse\b/i.test(input)) {
    return true;
  }
  if (sides.length < 3) return false;
  const [a, b, c] = [...sides].sort((x, y) => x - y);
  return Math.abs(a * a + b * b - c * c) < 0.05;
}

export function parseGeometryInput(raw: string): ParsedGeometryProblem | null {
  const input = raw.trim();
  if (!input || !looksLikeGeometry(input)) return null;

  const measured = extractLabeledMeasurements(input);
  const shapeType = detectShape(input);
  let sides = measured.sides;

  if (shapeType === 'rectangle' && measured.length && measured.width) {
    sides = [measured.length, measured.width];
  }
  if (shapeType === 'square' && sides.length === 1) {
    // keep side length
  }
  if (shapeType === 'circle' && !measured.radius && measured.diameter) {
    // radius filled later in solver
  }

  return {
    shapeType,
    find: detectFind(input),
    unit: detectUnit(input),
    sides,
    base: measured.base,
    height: measured.height,
    length: measured.length,
    width: measured.width,
    radius: measured.radius,
    diameter: measured.diameter,
    knownAngles: parseNumberList(firstMatch(input, /angles\s*=\s*([0-9.,\s]+)/i)),
    unknownAngleCount: extractStructuredNumber(input, 'unknownAngles'),
    parallelPairs: extractStructuredNumber(input, 'parallelPairs'),
    equalLengthPairs: extractStructuredNumber(input, 'equalLengthPairs'),
    isRightTriangle: inferRightTriangle(input, sides),
    labels: firstMatch(input, /labels\s*=\s*(.+)$/i)?.split(';').map((s) => s.trim()).filter(Boolean) ?? [],
    rawInput: input,
  };
}

export function geometryProblemLooksValid(problem: ParsedGeometryProblem): boolean {
  if (problem.shapeType === 'unknown' && problem.sides.length === 0 && !problem.radius && !problem.diameter) {
    return false;
  }
  return true;
}
