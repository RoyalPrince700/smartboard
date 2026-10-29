import { describe, expect, it } from 'vitest';
import {
  convertExponentsToLatex,
  isEquationLine,
  splitStepContent,
  wrapLeadingProseToLatex,
} from './mathPresentation';

describe('convertExponentsToLatex', () => {
  it('wraps numeric exponents in braces for KaTeX', () => {
    expect(convertExponentsToLatex('2^4')).toBe('2^{4}');
    expect(convertExponentsToLatex('2^(4)')).toBe('2^{4}');
    expect(convertExponentsToLatex('16 = 2^(4)')).toBe('16 = 2^{4}');
  });

  it('wraps variable exponents in braces', () => {
    expect(convertExponentsToLatex('2^x')).toBe('2^{x}');
    expect(convertExponentsToLatex('So 2^x = 2^(4)')).toBe('So 2^{x} = 2^{4}');
    expect(convertExponentsToLatex('3^(x+1)')).toBe('3^{x+1}');
  });
});

describe('wrapLeadingProseToLatex', () => {
  it('adds readable space after leading prose words', () => {
    expect(wrapLeadingProseToLatex('So 2^{x} = 2^{4}')).toBe('\\text{So }2^{x} = 2^{4}');
    expect(wrapLeadingProseToLatex('Therefore 2^{x} = 2^{4}')).toBe(
      '\\text{Therefore }2^{x} = 2^{4}'
    );
    expect(wrapLeadingProseToLatex('2^{x} = 2^{4}')).toBe('2^{x} = 2^{4}');
  });
});

describe('isEquationLine', () => {
  it('treats instructional prose as non-equation lines', () => {
    expect(isEquationLine('This gives the form ax + by = c.')).toBe(false);
    expect(isEquationLine('x terms: 2x + x = 3x')).toBe(false);
    expect(isEquationLine('We will eliminate y because its coefficients match.')).toBe(false);
  });

  it('treats equation labels and standalone numbers as equations', () => {
    expect(isEquationLine('Equation 1: 2x + y = 7')).toBe(true);
    expect(isEquationLine('3')).toBe(true);
    expect(isEquationLine('-1')).toBe(true);
    expect(isEquationLine('× 3')).toBe(true);
  });

  it('treats pure math lines as equations', () => {
    expect(isEquationLine('2x + y = 7')).toBe(true);
    expect(isEquationLine('→ 3x = 8')).toBe(true);
    expect(isEquationLine('x = [FRAC:8:3]')).toBe(true);
    expect(isEquationLine('2(2.6667) + y = 7')).toBe(true);
    expect(isEquationLine('3x + x = 4x')).toBe(true);
  });
});

describe('splitStepContent', () => {
  it('extracts equation labels and math into equations', () => {
    const content = [
      'Equation 1: 2x + y = 7',
      'Equation 2: x - y = 1',
    ].join('\n');

    const parsed = splitStepContent(content);

    expect(parsed.explanation).toBeUndefined();
    expect(parsed.equations).toEqual(['2x + y = 7', 'x - y = 1']);
  });

  it('keeps instructional lines in explanation and math in equations', () => {
    const content = [
      'Rearrange so all terms are on the left and the constant is on the right.',
      'This gives the form ax + by = c.',
    ].join('\n');

    const parsed = splitStepContent(content);

    expect(parsed.explanation).toContain('This gives the form ax + by = c.');
    expect(parsed.equations).toEqual([]);
  });

  it('extracts pure equation lines for KaTeX rendering', () => {
    const content = [
      '2x + y = 7',
      'x - y = 1',
      '→ 3x = 8',
    ].join('\n');

    const parsed = splitStepContent(content);

    expect(parsed.equations).toEqual(['2x + y = 7', 'x - y = 1', '3x = 8']);
  });

  it('extracts standalone coefficient numbers', () => {
    const parsed = splitStepContent('3\n-1');
    expect(parsed.equations).toEqual(['3', '-1']);
  });
});
