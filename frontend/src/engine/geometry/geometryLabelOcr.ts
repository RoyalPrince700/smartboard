import type { Point2 } from './strokeRoles';
import { boundsOf } from './strokeRoles';

const GARBAGE_LABEL = /^(?:m+|n+|w+|u+|i+|l+|r+|h+|mmm+|nnn+)$/i;
const ANGLE_NAME = /^(?:theta|alpha|beta|gamma|θ|φ|α|β|γ|x)$/i;

export function isAngleNameLabel(text: string): boolean {
  const compact = text.trim().replace(/\\/g, '').toLowerCase();
  return ANGLE_NAME.test(compact) || compact === 'theta';
}

function dist(a: Point2, b: Point2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizePoints(points: Point2[]): Point2[] {
  const b = boundsOf(points);
  const w = Math.max(b.x2 - b.x1, 1);
  const h = Math.max(b.y2 - b.y1, 1);
  return points.map((p) => ({
    x: (p.x - b.x1) / w,
    y: (p.y - b.y1) / h,
  }));
}

function crossings(points: Point2[], axis: 'x' | 'y', value: number): number {
  let count = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1][axis];
    const b = points[i][axis];
    if ((a - value) * (b - value) < 0) count += 1;
  }
  return count;
}

function fractionIn(points: Point2[], test: (p: Point2) => boolean): number {
  if (points.length === 0) return 0;
  return points.filter(test).length / points.length;
}

function hasLoop(points: Point2[]): boolean {
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 10; j < points.length; j += 1) {
      if (dist(points[i], points[j]) < 0.16) return true;
    }
  }
  return false;
}

/**
 * Lightweight stroke-geometry digit guess used when the math OCR model
 * (trained on equations) returns garbage like "mmm" for a side length.
 */
export function guessHandwrittenDigit(points: Point2[]): { text: string; confidence: number } | null {
  if (points.length < 6) return null;
  const b = boundsOf(points);
  const width = Math.abs(b.x2 - b.x1);
  const height = Math.abs(b.y2 - b.y1);
  const maxDim = Math.max(width, height);
  if (maxDim < 12) return null;

  const norm = normalizePoints(points);
  const start = norm[0];
  const end = norm[norm.length - 1];
  const closed = dist(start, end) < 0.28;
  const aspect = width / Math.max(height, 1);
  const midX = crossings(norm, 'x', 0.5);
  const midY = crossings(norm, 'y', 0.5);
  const lowY = crossings(norm, 'y', 0.72);
  const topHalf = fractionIn(norm, (p) => p.y < 0.45);
  const bottomHalf = fractionIn(norm, (p) => p.y > 0.55);
  const rightHalf = fractionIn(norm, (p) => p.x > 0.55);
  const leftHalf = fractionIn(norm, (p) => p.x < 0.45);
  const bottomBar = fractionIn(norm, (p) => p.y > 0.78);
  const topBar = fractionIn(norm, (p) => p.y < 0.22);

  const loop = hasLoop(norm);

  const scores: Array<{ digit: string; score: number }> = [];

  scores.push({
    digit: '1',
    score:
      (aspect < 0.45 ? 0.45 : 0) +
      (midX <= 1 ? 0.2 : 0) +
      (Math.abs(start.x - end.x) < 0.35 ? 0.15 : 0) +
      (closed ? -0.4 : 0.1),
  });

  scores.push({
    digit: '2',
    score:
      (start.y < 0.45 ? 0.22 : 0) +
      (end.y > 0.7 && end.x > 0.35 ? 0.28 : 0) +
      (bottomBar > 0.08 ? 0.22 : 0) +
      (closed ? -0.35 : 0.12) +
      (lowY >= 1 ? 0.1 : 0) +
      (aspect > 0.35 && aspect < 1.4 ? 0.08 : 0) +
      (loop ? -0.35 : 0.12),
  });

  scores.push({
    digit: '3',
    score:
      (leftHalf < 0.55 ? 0.12 : 0) +
      (end.y > 0.55 ? 0.12 : 0) +
      (midY >= 2 ? 0.22 : 0) +
      (closed ? -0.3 : 0.1) +
      (rightHalf > 0.4 ? 0.1 : 0),
  });

  scores.push({
    digit: '4',
    score:
      (closed ? 0.08 : 0) +
      (midX >= 1 && midY >= 1 ? 0.22 : 0) +
      (topHalf > 0.3 && bottomHalf > 0.2 ? 0.12 : 0) +
      (end.y > 0.55 ? 0.1 : 0),
  });

  scores.push({
    digit: '5',
    score:
      (topBar > 0.08 ? 0.22 : 0) +
      (start.y < 0.35 ? 0.12 : 0) +
      (end.y > 0.55 ? 0.12 : 0) +
      (closed ? -0.25 : 0.1),
  });

  scores.push({
    digit: '6',
    score:
      (bottomHalf > 0.42 ? 0.2 : 0) +
      (start.y < 0.45 ? 0.16 : 0) +
      (closed || dist(start, end) < 0.55 ? 0.18 : 0) +
      (midX >= 2 || midY >= 2 ? 0.16 : 0) +
      (end.y > 0.45 ? 0.1 : 0) +
      (aspect > 0.35 && aspect < 1.2 ? 0.08 : 0) +
      (loop ? 0.32 : 0),
  });

  scores.push({
    digit: '7',
    score:
      (topBar > 0.08 ? 0.25 : 0) +
      (start.y < 0.3 && start.x < 0.55 ? 0.18 : 0) +
      (end.y > 0.7 ? 0.18 : 0) +
      (closed ? -0.4 : 0.1) +
      (aspect < 1.1 ? 0.05 : 0),
  });

  scores.push({
    digit: '8',
    score: (closed ? 0.3 : 0) + (midY >= 2 ? 0.22 : 0) + (midX >= 2 ? 0.18 : 0) + (aspect > 0.45 && aspect < 1.1 ? 0.1 : 0),
  });

  scores.push({
    digit: '9',
    score:
      (topHalf > 0.42 ? 0.2 : 0) +
      (closed || dist(start, end) < 0.55 ? 0.16 : 0) +
      (end.y > 0.55 ? 0.16 : 0) +
      (start.y < 0.45 ? 0.1 : 0),
  });

  scores.push({
    digit: '0',
    score: (closed ? 0.35 : 0) + (Math.abs(aspect - 0.75) < 0.45 ? 0.15 : 0) + (midX >= 2 ? 0.15 : 0) + (topHalf > 0.3 && bottomHalf > 0.3 ? 0.1 : 0),
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score < 0.58) return null;
  if (/^[078]$/.test(best.digit)) return null;
  if (scores[1] && best.score - scores[1].score < 0.08 && best.score < 0.75) return null;

  const bBox = boundsOf(points);
  const w = Math.abs(bBox.x2 - bBox.x1);
  const h = Math.abs(bBox.y2 - bBox.y1);
  if (h <= w * 1.05) return null;
  if (closed && Math.min(w, h) / Math.max(w, h, 1) >= 0.7) return null;

  return { text: best.digit, confidence: Math.min(0.82, 0.4 + best.score * 0.35) };
}

const LETTER_TO_DIGIT: Record<string, string> = {
  z: '2',
  s: '5',
  g: '6',
  l: '1',
  t: '7',
  b: '6',
  q: '9',
};

export function sanitizeGeometryLabel(raw: string): string {
  let text = raw
    .trim()
    .replace(/\\theta/gi, 'θ')
    .replace(/\\alpha/gi, 'α')
    .replace(/\\beta/gi, 'β')
    .replace(/\\gamma/gi, 'γ')
    .replace(/\\phi/gi, 'φ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || GARBAGE_LABEL.test(text.replace(/\s/g, ''))) return '';
  if (isAngleNameLabel(text) || /^(0|o)$/i.test(text)) {
    if (/^(0|o)$/i.test(text) || text.toLowerCase() === 'theta') return 'θ';
    return text;
  }

  const degree = text.match(/(\d+(?:\.\d+)?)\s*°/);
  if (degree) return `${degree[1]}°`;

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);
  if (numbers.length === 1) {
    if (numbers[0] === '0') return 'θ';
    return numbers[0];
  }
  if (numbers.length > 1) return numbers.filter((n) => n !== '0').join(',');

  const compact = text.replace(/\s/g, '');
  if (compact.length === 1) {
    if (isAngleNameLabel(compact)) return compact;
    const mapped = LETTER_TO_DIGIT[compact.toLowerCase()];
    if (mapped) return mapped;
  }

  if (/^[A-Z]$/.test(compact)) return compact;
  if (compact.length <= 3 && /[1-9]/.test(compact)) return compact;
  return '';
}

export function isUsefulGeometryLabel(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || GARBAGE_LABEL.test(trimmed.replace(/\s/g, ''))) return false;
  if (trimmed === '0') return false;
  if (isAngleNameLabel(trimmed)) return true;
  if (/[1-9]/.test(trimmed)) return true;
  if (/^[A-Z]$/.test(trimmed)) return true;
  return false;
}

export function labelFromOcrOrStroke(
  ocrText: string,
  points: Point2[]
): { text: string; confidence: number; source: 'ocr' | 'digit-guess' } | null {
  const sanitized = sanitizeGeometryLabel(ocrText);
  if (sanitized && isUsefulGeometryLabel(sanitized)) {
    return { text: sanitized, confidence: 0.8, source: 'ocr' };
  }

  const guessed = guessHandwrittenDigit(points);
  if (guessed) return { ...guessed, source: 'digit-guess' };
  return null;
}
