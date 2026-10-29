import { describe, expect, it } from 'vitest';
import { normalizeOcrMath } from './mathOcrNormalization';

describe('normalizeOcrMath — exponential braces', () => {
  it('unwraps CoMER LaTeX braces for 2^{x}=2^{4}', () => {
    const result = normalizeOcrMath('2^{x}=2^{4}');
    expect(result.text.replace(/\s+/g, '')).toBe('2^x=2^4');
    expect(result.topic).toBe('exponential');
    expect(result.isEquation).toBe(true);
  });

  it('unwraps compound exponents 3^{x+1}=27', () => {
    const result = normalizeOcrMath('3^{x+1}=27');
    expect(result.text.replace(/\s+/g, '')).toBe('3^(x+1)=27');
    expect(result.topic).toBe('exponential');
  });

  it('still normalizes quadratic ^{2}', () => {
    const result = normalizeOcrMath('x^{2}+5x+6=0');
    expect(result.text.replace(/\s+/g, '')).toBe('x^2+5x+6=0');
    expect(result.topic).toBe('quadratic');
  });
});
