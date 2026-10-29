/**
 * Picture sums for small, one-step arithmetic.
 * Algebra, chained expressions, powers, and large counts stay as numbers.
 */

export type CountingOp = '+' | '-' | '*' | '/';

export interface CountingFigure {
  id: 'egg' | 'pencil' | 'house' | 'car' | 'apple' | 'balloon' | 'flower' | 'star';
  singular: string;
  plural: string;
}

export interface CountingScene {
  left: number;
  op: CountingOp;
  right: number;
  result: number;
  /** Addition pairs two different objects. Other operations use one object. */
  leftFigure: CountingFigure;
  rightFigure: CountingFigure;
}

export const COUNTING_FIGURES: readonly CountingFigure[] = [
  { id: 'egg', singular: 'egg', plural: 'eggs' },
  { id: 'pencil', singular: 'pencil', plural: 'pencils' },
  { id: 'house', singular: 'house', plural: 'houses' },
  { id: 'car', singular: 'car', plural: 'cars' },
  { id: 'apple', singular: 'apple', plural: 'apples' },
  { id: 'balloon', singular: 'balloon', plural: 'balloons' },
  { id: 'flower', singular: 'flower', plural: 'flowers' },
  { id: 'star', singular: 'star', plural: 'stars' },
];

const MAX_OPERAND = 10;
const MAX_PRODUCT = 12;
const MAX_DIVIDEND = 12;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function figureLabel(count: number, figure: CountingFigure): string {
  const name = count === 1 ? figure.singular : figure.plural;
  return `${count} ${name}`;
}

function pickFigures(key: string, pair: boolean): [CountingFigure, CountingFigure] {
  const total = COUNTING_FIGURES.length;
  const start = hashString(key) % total;
  const left = COUNTING_FIGURES[start];
  if (!pair) return [left, left];
  const offset = 1 + (hashString(`${key}:b`) % (total - 1));
  return [left, COUNTING_FIGURES[(start + offset) % total]];
}

/**
 * Accepts a single small operation such as 3+2, 5−3, 4×3, or 8÷2.
 * A trailing equals and numeric answer are ignored. Anything with a letter,
 * a bracket, a power, or a second operation is left out.
 */
export function parseCountingScene(input: string): CountingScene | null {
  const raw = input.trim();
  if (!raw || /[a-zA-Z]/.test(raw) || /[()^[\]]/.test(raw)) return null;

  let body = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  const equalsAt = body.indexOf('=');
  if (equalsAt !== -1) {
    const rhs = body.slice(equalsAt + 1);
    if (rhs !== '' && !/^\d+$/.test(rhs)) return null;
    body = body.slice(0, equalsAt);
  }
  if (!body) return null;

  const match = body.match(/^(\d+)([+\-*/])(\d+)$/);
  if (!match) return null;

  const left = Number(match[1]);
  const op = match[2] as CountingOp;
  const right = Number(match[3]);
  if (left > MAX_OPERAND || right > MAX_OPERAND) return null;

  let result = 0;
  if (op === '+') {
    result = left + right;
  } else if (op === '-') {
    if (left < right) return null;
    result = left - right;
  } else if (op === '*') {
    if (left === 0 || right === 0) return null;
    result = left * right;
    if (result > MAX_PRODUCT) return null;
  } else if (right === 0 || left === 0 || left > MAX_DIVIDEND || left % right !== 0) {
    return null;
  } else {
    result = left / right;
    if (result > MAX_OPERAND) return null;
  }

  const [leftFigure, rightFigure] = pickFigures(`${left}${op}${right}`, op === '+');
  return { left, op, right, result, leftFigure, rightFigure };
}
