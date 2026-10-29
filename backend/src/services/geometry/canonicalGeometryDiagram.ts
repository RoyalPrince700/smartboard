import { DiagramElement, DiagramSpec } from '../../types/geometry';

const W = 560;
const H = 360;

export interface GeometryDiagramInput {
  shapeType?: string;
  problemType?: string;
  trigTask?: string;
  sides?: number[];
  base?: number;
  height?: number;
  length?: number;
  width?: number;
  radius?: number;
  unit?: string;
  isRightTriangle?: boolean;
  opposite?: number;
  adjacent?: number;
  angleLabel?: string;
  knownAngles?: number[];
  hypotenuse?: number;
}

function el(partial: DiagramElement): DiagramElement {
  return partial;
}

function asNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function asNumberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(asNumber).filter((n): n is number => n !== undefined);
}

function unitOf(input: GeometryDiagramInput): string {
  return String(input.unit || 'cm').replace(/2$/, '²');
}

function label(n: number | undefined, unit: string, fallback = ''): string {
  if (n === undefined) return fallback;
  const rounded = Math.round(n * 100) / 100;
  return `${rounded} ${unit}`.trim();
}

function scalePair(a: number, b: number, maxPx: number): { a: number; b: number } {
  const max = Math.max(a, b, 0.001);
  const scale = maxPx / max;
  return { a: Math.max(48, a * scale), b: Math.max(48, b * scale) };
}

function rightTriangle(input: GeometryDiagramInput): DiagramSpec {
  const unit = unitOf(input);
  const oppositeGiven = asNumber(input.opposite) ?? asNumber(input.height) ?? input.sides?.[0];
  const adjacentGiven = asNumber(input.adjacent) ?? asNumber(input.base) ?? input.sides?.[1];
  const opposite = oppositeGiven ?? 3;
  const adjacent = adjacentGiven ?? 4;
  const hypotenuse =
    asNumber(input.hypotenuse) ??
    (oppositeGiven !== undefined && adjacentGiven !== undefined
      ? Math.sqrt(opposite * opposite + adjacent * adjacent)
      : undefined);
  const angleLabel =
    input.angleLabel ||
    (String(input.problemType || '').toLowerCase() === 'trigonometry' ? 'θ' : '');
  const sized = scalePair(opposite, adjacent, 210);
  const originX = 110;
  const originY = 290;
  const top = { x: originX, y: originY - sized.a };
  const right = { x: originX + sized.b, y: originY };
  const corner = { x: originX, y: originY };

  return {
    title: 'Triangle',
    category: 'geometry',
    width: W,
    height: H,
    description: 'Clean redraw of the triangle',
    elements: [
      el({
        type: 'triangle',
        points: [top, corner, right],
        color: '#1f2937',
        strokeWidth: 3,
      }),
      el({
        type: 'rectangle',
        x1: originX,
        y1: originY - 18,
        width: 18,
        height: 18,
        color: '#1f2937',
        strokeWidth: 2,
      }),
      ...(angleLabel
        ? [el({ type: 'arc', cx: right.x, cy: right.y, radius: 28, color: '#4f46e5' })]
        : []),
      ...(oppositeGiven !== undefined
        ? [
            el({
              type: 'label',
              x1: originX - 36,
              y1: originY - sized.a / 2,
              text: label(opposite, unit),
              color: '#111827',
            }),
          ]
        : []),
      ...(adjacentGiven !== undefined
        ? [
            el({
              type: 'label',
              x1: originX + sized.b / 2 - 18,
              y1: originY + 28,
              text: label(adjacent, unit),
              color: '#111827',
            }),
          ]
        : []),
      ...(hypotenuse !== undefined
        ? [
            el({
              type: 'label',
              x1: originX + sized.b / 2 + 8,
              y1: originY - sized.a / 2 - 8,
              text: label(hypotenuse, unit, 'hyp'),
              color: '#4f46e5',
            }),
          ]
        : []),
      ...(angleLabel
        ? [
            el({
              type: 'label',
              x1: right.x - 18,
              y1: right.y - 36,
              text: angleLabel,
              color: '#4f46e5',
            }),
          ]
        : []),
    ],
  };
}

function scaleneTriangle(input: GeometryDiagramInput): DiagramSpec {
  const unit = unitOf(input);
  const sides = [...(input.sides ?? [])];
  if (sides.length < 3) return rightTriangle(input);

  const [a, b, c] = sides;
  const base = c;
  const x = (b * b + c * c - a * a) / (2 * c);
  const heightSq = Math.max(b * b - x * x, 1);
  const height = Math.sqrt(heightSq);
  const sized = scalePair(base, height, 240);
  const originX = 80;
  const originY = 300;
  const left = { x: originX, y: originY };
  const right = { x: originX + sized.a, y: originY };
  const top = {
    x: originX + (x / base) * sized.a,
    y: originY - sized.b,
  };

  return {
    title: 'Triangle',
    category: 'geometry',
    width: W,
    height: H,
    description: 'Clean redraw of the triangle',
    elements: [
      el({ type: 'triangle', points: [top, left, right], color: '#1f2937', strokeWidth: 3 }),
      el({
        type: 'label',
        x1: (left.x + right.x) / 2 - 12,
        y1: originY + 26,
        text: label(c, unit),
        color: '#111827',
      }),
      el({
        type: 'label',
        x1: (left.x + top.x) / 2 - 28,
        y1: (left.y + top.y) / 2,
        text: label(b, unit),
        color: '#111827',
      }),
      el({
        type: 'label',
        x1: (right.x + top.x) / 2 + 8,
        y1: (right.y + top.y) / 2,
        text: label(a, unit),
        color: '#111827',
      }),
    ],
  };
}

function rectangleDiagram(input: GeometryDiagramInput, square = false): DiagramSpec {
  const unit = unitOf(input);
  const lengthGiven = asNumber(input.length) ?? input.sides?.[0];
  const widthGiven = square ? lengthGiven : asNumber(input.width) ?? input.sides?.[1];
  const length = lengthGiven ?? 8;
  const width = widthGiven ?? (square ? length : 5);
  const sized = scalePair(length, width, 240);
  const x = 120;
  const y = 70;

  return {
    title: square ? 'Square' : 'Rectangle',
    category: 'geometry',
    width: W,
    height: H,
    description: `Clean redraw of the ${square ? 'square' : 'rectangle'}`,
    elements: [
      el({
        type: 'rectangle',
        x1: x,
        y1: y,
        width: sized.a,
        height: sized.b,
        color: '#1f2937',
        strokeWidth: 3,
      }),
      ...(lengthGiven !== undefined
        ? [
            el({
              type: 'label',
              x1: x + sized.a / 2 - 18,
              y1: y + sized.b + 28,
              text: label(length, unit),
              color: '#111827',
            }),
          ]
        : []),
      ...(widthGiven !== undefined
        ? [
            el({
              type: 'label',
              x1: x - 52,
              y1: y + sized.b / 2,
              text: label(width, unit),
              color: '#111827',
            }),
          ]
        : []),
    ],
  };
}

function circleDiagram(input: GeometryDiagramInput): DiagramSpec {
  const unit = unitOf(input);
  const radiusGiven = asNumber(input.radius) ?? input.sides?.[0];
  const radius = radiusGiven ?? 7;
  const r = 90;
  const cx = 280;
  const cy = 190;

  return {
    title: 'Circle',
    category: 'geometry',
    width: W,
    height: H,
    description: 'Clean redraw of the circle',
    elements: [
      el({ type: 'circle', cx, cy, radius: r, color: '#1f2937', strokeWidth: 3 }),
      el({ type: 'line', x1: cx, y1: cy, x2: cx + r, y2: cy, color: '#4f46e5', strokeWidth: 2 }),
      el({ type: 'point', cx, cy, color: '#111827' }),
      ...(radiusGiven !== undefined
        ? [
            el({
              type: 'label',
              x1: cx + r / 2 - 8,
              y1: cy - 12,
              text: `r = ${label(radius, unit)}`,
              color: '#4f46e5',
            }),
          ]
        : []),
    ],
  };
}

function angleDiagram(input: GeometryDiagramInput): DiagramSpec {
  const known = input.knownAngles?.[0];
  return {
    title: 'Angle diagram',
    category: 'geometry',
    width: W,
    height: H,
    description: 'Clean redraw of the angle diagram',
    elements: [
      el({ type: 'line', x1: 80, y1: 260, x2: 480, y2: 260, color: '#1f2937', strokeWidth: 3 }),
      el({ type: 'line', x1: 240, y1: 260, x2: 360, y2: 90, color: '#1f2937', strokeWidth: 3 }),
      el({ type: 'arc', cx: 240, cy: 260, radius: 42, color: '#4f46e5' }),
      el({
        type: 'label',
        x1: 268,
        y1: 228,
        text: known !== undefined ? `${known}°` : 'x',
        color: '#4f46e5',
      }),
    ],
  };
}

export function generateCanonicalGeometryDiagram(input: GeometryDiagramInput): DiagramSpec | null {
  const shape = String(input.shapeType || '').toLowerCase();
  const problemType = String(input.problemType || '').toLowerCase();
  const trigTask = String(input.trigTask || '');

  if (trigTask === 'evaluate_known_angle' || trigTask === 'find_angle') {
    return null;
  }

  if (
    problemType === 'trigonometry' ||
    trigTask === 'find_angle_from_sides' ||
    asNumber(input.opposite) !== undefined ||
    asNumber(input.adjacent) !== undefined
  ) {
    return rightTriangle({ ...input, shapeType: 'triangle', isRightTriangle: true });
  }

  if (shape === 'triangle' || input.isRightTriangle) {
    if (input.isRightTriangle || (input.sides?.length ?? 0) < 3) return rightTriangle(input);
    return scaleneTriangle(input);
  }
  if (shape === 'square') return rectangleDiagram(input, true);
  if (shape === 'rectangle') return rectangleDiagram(input);
  if (shape === 'circle') return circleDiagram(input);
  if (shape === 'angle_diagram') return angleDiagram(input);

  return null;
}

export function geometryDiagramInputFromRecognized(
  data: Record<string, unknown> | undefined
): GeometryDiagramInput | null {
  if (!data) return null;
  return {
    shapeType: data.shapeType !== undefined ? String(data.shapeType) : undefined,
    problemType: data.problemType !== undefined ? String(data.problemType) : undefined,
    trigTask: data.trigTask !== undefined ? String(data.trigTask) : undefined,
    sides: asNumberList(data.sides),
    base: asNumber(data.base),
    height: asNumber(data.height),
    length: asNumber(data.length),
    width: asNumber(data.width),
    radius: asNumber(data.radius),
    unit: data.unit !== undefined ? String(data.unit) : undefined,
    isRightTriangle: Boolean(data.isRightTriangle),
    opposite: asNumber(data.opposite),
    adjacent: asNumber(data.adjacent),
    angleLabel: data.angleLabel !== undefined ? String(data.angleLabel) : undefined,
    knownAngles: asNumberList(data.knownAngles),
    hypotenuse: asNumber(data.hypotenuse),
  };
}
