import { describe, expect, it } from 'vitest';
import { classifyEquationInput, looksLikeProbability, isClearEquationInput } from './equationClassifier';

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
