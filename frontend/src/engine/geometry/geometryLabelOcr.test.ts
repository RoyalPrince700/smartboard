import { describe, expect, it } from 'vitest';
import { guessHandwrittenDigit, isUsefulGeometryLabel, sanitizeGeometryLabel } from './geometryLabelOcr';

function digitTwo() {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 8; i += 1) points.push({ x: 20 + i * 4, y: 12 + Math.sin((i / 8) * Math.PI) * 6 });
  for (let i = 1; i <= 10; i += 1) points.push({ x: 52 - i * 3.2, y: 18 + i * 5 });
  for (let i = 1; i <= 8; i += 1) points.push({ x: 20 + i * 4.2, y: 70 });
  return points;
}

function digitSix() {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 6; i += 1) points.push({ x: 40 - i * 0.8, y: 6 + i * 4 });
  for (let t = 0; t <= 24; t += 1) {
    const a = -Math.PI * 0.2 + (t / 24) * Math.PI * 1.85;
    points.push({ x: 28 + 14 * Math.cos(a), y: 48 + 14 * Math.sin(a) });
  }
  return points;
}

describe('geometryLabelOcr', () => {
  it('drops math-OCR garbage such as mmm', () => {
    expect(sanitizeGeometryLabel('mmm')).toBe('');
    expect(sanitizeGeometryLabel('nnn')).toBe('');
    expect(isUsefulGeometryLabel('mmm')).toBe(false);
  });

  it('keeps real side lengths and degree marks', () => {
    expect(sanitizeGeometryLabel('6')).toBe('6');
    expect(sanitizeGeometryLabel('2 cm')).toBe('2');
    expect(sanitizeGeometryLabel('90°')).toBe('90°');
    expect(isUsefulGeometryLabel('6')).toBe(true);
  });

  it('maps common single-letter OCR confusions to digits', () => {
    expect(sanitizeGeometryLabel('z')).toBe('2');
    expect(sanitizeGeometryLabel('G')).toBe('6');
  });

  it('keeps theta and does not treat 0 as a side length', () => {
    expect(sanitizeGeometryLabel('\\theta')).toBe('θ');
    expect(sanitizeGeometryLabel('0')).toBe('θ');
    expect(isUsefulGeometryLabel('θ')).toBe(true);
    expect(isUsefulGeometryLabel('0')).toBe(false);
  });

  it('guesses a handwritten 2 from stroke geometry when OCR fails', () => {
    const guessed = guessHandwrittenDigit(digitTwo());
    expect(guessed?.text).toBe('2');
  });

  it('guesses a handwritten 6 from stroke geometry when OCR fails', () => {
    const guessed = guessHandwrittenDigit(digitSix());
    expect(guessed?.text).toBe('6');
  });
});
