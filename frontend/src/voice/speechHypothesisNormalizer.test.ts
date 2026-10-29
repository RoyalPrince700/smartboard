import { describe, expect, it } from 'vitest';
import { formatMathTokens, tokenizeMathSpeech } from './mathTokenizer';
import { normalizeSpeechHypothesis } from './speechHypothesisNormalizer';

function eq(spoken: string, previousLexeme?: string): string {
  return formatMathTokens(tokenizeMathSpeech(spoken, previousLexeme));
}

describe('math-aware speech normalization', () => {
  it('maps number words without global replacements', () => {
    expect(eq('two')).toBe('2');
    expect(eq('three')).toBe('3');
    expect(eq('five')).toBe('5');
    expect(eq('seven')).toBe('7');
  });

  it('accepts clear x mishears, not equals fragments', () => {
    expect(eq('ecs')).toBe('x');
    expect(eq('eks')).toBe('x');
    expect(eq('ex')).toBe('x');
    expect(eq('2 s')).toBe('2x');
    expect(eq('two ecs')).toBe('2x');
    expect(eq('2ex')).toBe('2x');
    expect(eq('2s')).toBe('2x');
    expect(eq('s', '2')).toBe('x');
  });

  it('accepts slow or accented digit words', () => {
    expect(eq('to')).toBe('2');
    expect(eq('tu')).toBe('2');
    expect(eq('tree')).toBe('3');
    expect(eq('fife')).toBe('5');
    expect(eq('tw')).toBe('2');
    expect(eq('fiv')).toBe('5');
    expect(eq('wo')).toBe('2');
    expect(eq('won')).toBe('1');
    expect(eq('seben')).toBe('7');
    expect(eq('nain')).toBe('9');
    expect(eq('ziro')).toBe('0');
  });

  it('does not corrupt unrelated words or equals fragments', () => {
    expect(normalizeSpeechHypothesis('example')).not.toContain('xample');
    expect(eq('so')).toBe('');
    expect(eq('sol')).toBe('');
    expect(eq('s')).toBe('');
    expect(eq('e')).toBe('');
    expect(eq('es')).toBe('');
    expect(eq('eggs')).toBe('');
    expect(eq('axe')).toBe('');
    expect(eq('do')).toBe('');
    expect(eq('who')).toBe('');
    expect(eq('is')).toBe('');
  });

  it('does not treat equals as x or inject e', () => {
    expect(eq('2x e')).toBe('2x');
    expect(eq('2x es')).toBe('2x');
    expect(eq('2x s')).toBe('2x');
    expect(eq('e', '2x')).toBe('');
    expect(eq('es', '2x')).toBe('');
    expect(eq('s', '2x')).toBe('');
    expect(eq('2x equals 5')).toBe('2x = 5');
    expect(eq('2x is 5')).toBe('2x = 5');
  });

  it('maps operators', () => {
    expect(eq('plus')).toBe('+');
    expect(eq('minus')).toBe('-');
    expect(eq('2x minus 5')).toBe('2x - 5');
    expect(eq('2x minas 5')).toBe('2x - 5');
    expect(eq('2x mine 5')).toBe('2x - 5');
    expect(eq('equals')).toBe('=');
    expect(eq('equal to')).toBe('=');
    expect(eq('divided by')).toBe('/');
    expect(eq('3 over 4')).toBe('3 / 4');
    expect(eq('3 multiplied by 4')).toBe('3 * 4');
    expect(eq('3 times 4')).toBe('3 * 4');
  });

  it('normalizes spoken linear equations', () => {
    expect(eq('two x')).toBe('2x');
    expect(eq('two ex')).toBe('2x');
    expect(eq('2 ex')).toBe('2x');
    expect(eq('two times x')).toBe('2x');
    expect(eq('two x minus five')).toBe('2x - 5');
    expect(eq('two x minus five equals x plus two')).toBe('2x - 5 = x + 2');
    expect(eq('2x minus 5 equals x plus 2')).toBe('2x - 5 = x + 2');
  });

  it('accepts square as well as squared, including 2xsquare', () => {
    expect(eq('2x square')).toBe('2x^2');
    expect(eq('2x squared')).toBe('2x^2');
    expect(eq('2xsquare')).toBe('2x^2');
    expect(eq('two x square')).toBe('2x^2');
  });

  it('raises a digit to x or to any digit, not only square', () => {
    expect(eq('2 raise to power x')).toBe('2^x');
    expect(eq('2 raised to the power of x')).toBe('2^x');
    expect(eq('two to the power of x')).toBe('2^x');
    expect(eq('2 to the x')).toBe('2^x');
    expect(eq('2 to the power of 3')).toBe('2^3');
    expect(eq('2 raise to power 5')).toBe('2^5');
    expect(eq('two to the power of three')).toBe('2^3');
    expect(eq('2 to the 4')).toBe('2^4');
    expect(eq('5 power 7')).toBe('5^7');
    expect(eq('2^x')).toBe('2^x');
    expect(eq('2^x equals 8')).toBe('2^x = 8');
  });

  it('accepts equals / equal to / equals to', () => {
    expect(eq('2x equals 5')).toBe('2x = 5');
    expect(eq('2x equal to 5')).toBe('2x = 5');
    expect(eq('2x equals to 5')).toBe('2x = 5');
  });

  it('accepts y and simultaneous equations with comma or and', () => {
    expect(eq('y')).toBe('y');
    expect(eq('why')).toBe('y');
    expect(eq('2 y')).toBe('2y');
    expect(eq('2x plus y equals 7')).toBe('2x + y = 7');
    expect(eq('2x y equals 7')).toBe('2x + y = 7');
    expect(eq('2x and y equals 7')).toBe('2x + y = 7');
    expect(eq('x minus y equals 1')).toBe('x - y = 1');
    expect(eq('2x plus y equals 7 comma x minus y equals 1')).toBe('2x + y = 7, x - y = 1');
    expect(eq('2x plus y equals 7 and x minus y equals 1')).toBe('2x + y = 7, x - y = 1');
    expect(eq('2x + y = 7, x - y = 1')).toBe('2x + y = 7, x - y = 1');
  });

  it('folds brackets, fractions, roots, inequalities, abs, z, trig, pi, and logs', () => {
    expect(
      eq('open bracket x plus 1 close bracket open bracket x minus 2 close bracket equals 0')
    ).toBe('(x+1)(x-2) = 0');
    expect(eq('x over 2')).toBe('x / 2');
    expect(eq('open bracket 2x plus 1 close bracket over 3')).toBe('(2x+1) / 3');
    expect(eq('2x plus 1 over 3')).toBe('2x + 1 / 3');
    expect(eq('square root of x plus 4 equals 5')).toBe('sqrt(x+4) = 5');
    expect(eq('square root of x plus 4 equals 5')).not.toContain('^2');
    expect(eq('2x plus 1 greater than 7')).toBe('2x + 1 > 7');
    expect(eq('2x plus 1 greater than or equal to 7')).toBe('2x + 1 >= 7');
    expect(eq('2x plus 1 less than 7')).toBe('2x + 1 < 7');
    expect(eq('absolute x minus 3 equals 5')).toBe('|x-3| = 5');
    expect(eq('absolute value of x minus 3 equals 5')).toBe('|x-3| = 5');
    expect(eq('x plus y plus z equals 6')).toBe('x + y + z = 6');
    expect(eq('x plus why plus zed equals 6')).toBe('x + y + z = 6');
    expect(eq('sin x equals 1 over 2')).toBe('sin(x) = 1 / 2');
    expect(eq('sine x equals one half')).toBe('sin(x) = 1 / 2');
    expect(eq('2 pi r')).toBe('2pi*r');
    expect(eq('2 pie r')).toBe('2pi*r');
    expect(eq('two times pi r')).toBe('2pi*r');
    expect(eq('log x equals 2')).toBe('log(x) = 2');
    expect(eq('log of x equals 2')).toBe('log(x) = 2');
    expect(eq('ln x equals 1')).toBe('ln(x) = 1');
  });

  it('does not treat isolated r, pie fragments, or square root as square', () => {
    expect(eq('r')).toBe('');
    expect(eq('are')).toBe('');
    expect(eq('square root')).toBe('sqrt');
    expect(eq('square root')).not.toContain('^2');
    expect(eq('equal to')).toBe('=');
  });
});
