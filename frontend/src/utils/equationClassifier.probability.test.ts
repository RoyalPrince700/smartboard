import { describe, expect, it } from 'vitest';
import {
  classifyEquationInput,
  isClearEquationInput,
  isPlainArithmeticExpression,
  looksLikeProbability,
} from './equationClassifier';

describe('equationClassifier — probability', () => {
  it('classifies probability word problems', () => {
    const result = classifyEquationInput(
      'A bag has 5 red and 3 blue marbles. What is the probability of picking a red marble?'
    );
    expect(result.topic).toBe('probability');
    expect(result.isMath).toBe(true);
  });

  it('detects spoken-style probability prompts', () => {
    expect(looksLikeProbability('what is the probability of rolling an even number on a die')).toBe(true);
  });

  it('treats clear probability input without equals sign', () => {
    expect(isClearEquationInput('probability of 3 out of 10')).toBe(true);
  });

  it('does not classify linear equations as probability', () => {
    const result = classifyEquationInput('2x + 3 = 7');
    expect(result.topic).not.toBe('probability');
  });
});

describe('equationClassifier — arithmetic without equals', () => {
  it('treats 3+4 as arithmetic', () => {
    const result = classifyEquationInput('3+4');
    expect(result.topic).toBe('arithmetic');
    expect(result.isMath).toBe(true);
    expect(isClearEquationInput('3+4')).toBe(true);
    expect(isPlainArithmeticExpression('3 + 4')).toBe(true);
  });

  it('treats chained arithmetic and parentheses as arithmetic', () => {
    expect(classifyEquationInput('12 - 5').topic).toBe('arithmetic');
    expect(classifyEquationInput('(2+5)*3').topic).toBe('arithmetic');
    expect(isClearEquationInput('3*5+2')).toBe(true);
  });

  it('still accepts arithmetic that includes an equals sign', () => {
    expect(classifyEquationInput('3+4=0').topic).toBe('arithmetic');
    expect(classifyEquationInput('4+2+4 =').topic).toBe('arithmetic');
  });

  it('does not treat a lone number or a variable equation as plain arithmetic', () => {
    expect(isPlainArithmeticExpression('7')).toBe(false);
    expect(isPlainArithmeticExpression('3+')).toBe(false);
    expect(classifyEquationInput('2x+3=7').topic).toBe('linear');
  });
});
