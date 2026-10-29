import { describe, expect, it } from 'vitest';
import {
  cleanVoiceText,
  normalizeSpokenMath,
  parseVoiceCommand,
  pickBestEquation,
  sanitizeEquationInput,
  formatSolvedArithmeticDisplay,
  tokenizeSpokenMath,
} from './voiceMathParser';

describe('cleanVoiceText', () => {
  it('strips trailing punctuation from speech', () => {
    expect(cleanVoiceText('Solve.')).toBe('solve');
    expect(cleanVoiceText('zero!')).toBe('zero');
  });
});

describe('normalizeSpokenMath', () => {
  it('converts square / squared into exponents', () => {
    expect(normalizeSpokenMath('2x square')).toBe('2x^2');
    expect(tokenizeSpokenMath('2 x square plus 5x minus 3 equals zero')).toEqual([
      '2x^2',
      '+',
      '5x',
      '-',
      '3',
      '=',
      '0',
    ]);
  });

  it('raises a digit to x or to any digit', () => {
    expect(tokenizeSpokenMath('2 raise to power x')).toEqual(['2^x']);
    expect(tokenizeSpokenMath('2 to the power of 3')).toEqual(['2^3']);
    expect(tokenizeSpokenMath('two to the x')).toEqual(['2^x']);
    expect(normalizeSpokenMath('2 raise to power 5')).toBe('2^5');
  });

  it('keeps 6x intact', () => {
    expect(tokenizeSpokenMath('6x')).toEqual(['6x']);
    expect(tokenizeSpokenMath('6 x')).toEqual(['6x']);
    expect(tokenizeSpokenMath('six x')).toEqual(['6x']);
    expect(tokenizeSpokenMath('2x plus 6x equals 0')).toEqual(['2x', '+', '6x', '=', '0']);
  });

  it('tokenizes y and comma-separated simultaneous equations', () => {
    expect(tokenizeSpokenMath('2x plus y equals 7')).toEqual(['2x', '+', 'y', '=', '7']);
    expect(tokenizeSpokenMath('2x plus y equals 7 comma x minus y equals 1')).toEqual([
      '2x',
      '+',
      'y',
      '=',
      '7',
      ',',
      'x',
      '-',
      'y',
      '=',
      '1',
    ]);
    expect(tokenizeSpokenMath('2x and y equals 7')).toEqual(['2x', '+', 'y', '=', '7']);
  });

  it('tokenizes brackets, fractions, roots, inequalities, abs, z, trig, pi, and logs', () => {
    expect(
      tokenizeSpokenMath(
        'open bracket x plus 1 close bracket open bracket x minus 2 close bracket equals 0'
      )
    ).toEqual(['(x+1)(x-2)', '=', '0']);
    expect(tokenizeSpokenMath('x over 2')).toEqual(['x', '/', '2']);
    expect(tokenizeSpokenMath('square root of x plus 4 equals 5')).toEqual(['sqrt(x+4)', '=', '5']);
    expect(tokenizeSpokenMath('2x plus 1 greater than 7')).toEqual(['2x', '+', '1', '>', '7']);
    expect(tokenizeSpokenMath('absolute x minus 3 equals 5')).toEqual(['|x-3|', '=', '5']);
    expect(tokenizeSpokenMath('x plus y plus z equals 6')).toEqual(['x', '+', 'y', '+', 'z', '=', '6']);
    expect(tokenizeSpokenMath('sin x equals 1 over 2')).toEqual(['sin(x)', '=', '1', '/', '2']);
    expect(tokenizeSpokenMath('2 pi r')).toEqual(['2pi*r']);
    expect(tokenizeSpokenMath('log x equals 2')).toEqual(['log(x)', '=', '2']);
  });

  it('does not glue leftover e from equals onto the equation', () => {
    expect(tokenizeSpokenMath('2x e')).toEqual(['2x']);
    expect(tokenizeSpokenMath('2x e 5')).toEqual(['2x', '5']);
    expect(tokenizeSpokenMath('2x equals 5')).toEqual(['2x', '=', '5']);
  });

  it('keeps the digit before trailing solve and ignores so/sol prefixes', () => {
    expect(tokenizeSpokenMath('2x + 5 = 6 solve')).toEqual(['2x', '+', '5', '=', '6']);
    expect(tokenizeSpokenMath('2x + 5 = 6 so')).toEqual(['2x', '+', '5', '=', '6']);
    expect(normalizeSpokenMath('2x + 5 = 6 solve')).toBe('2x + 5 = 6');
  });
});

describe('sanitizeEquationInput', () => {
  it('collapses duplicate equals signs', () => {
    expect(sanitizeEquationInput('3 + 4 = =')).toBe('3 + 4 =');
    expect(sanitizeEquationInput('3+4==')).toBe('3+4 =');
    expect(sanitizeEquationInput('2x - 5 = = 10')).toBe('2x - 5 = 10');
  });
});

describe('formatSolvedArithmeticDisplay', () => {
  it('shows the computed answer in the question bar', () => {
    expect(formatSolvedArithmeticDisplay('4 + 5 =', '9')).toBe('4 + 5 = 9');
    expect(formatSolvedArithmeticDisplay('4 + 5 = 4', '9')).toBe('4 + 5 = 9');
  });
});

describe('pickBestEquation', () => {
  it('does not let incomplete speech wipe a complete board equation', () => {
    expect(pickBestEquation('2x+5=', '2x+5=6')).toBe('2x+5=6');
    expect(pickBestEquation('2x+5=6', '2x+5=')).toBe('2x+5=6');
  });
});

describe('parseVoiceCommand', () => {
  it('treats confirmed solve and Chrome short forms as solve', () => {
    expect(parseVoiceCommand('solve')).toEqual({ type: 'solve', writeToBoard: false });
    expect(parseVoiceCommand('so')).toEqual({ type: 'solve', writeToBoard: false });
    expect(parseVoiceCommand('sol')).toEqual({ type: 'solve', writeToBoard: false });
    expect(parseVoiceCommand('solv')).toEqual({ type: 'solve', writeToBoard: false });
  });

  it('solves when equation ends with solve or so/sol', () => {
    expect(parseVoiceCommand('2x + 5 = 6 solve')).toEqual({
      type: 'solve-equation',
      equation: '2x+5=6',
      writeToBoard: false,
    });
    expect(parseVoiceCommand('2x + 5 = 6 so')).toEqual({
      type: 'solve-equation',
      equation: '2x+5=6',
      writeToBoard: false,
    });
  });

  it('keeps 6x as append', () => {
    expect(parseVoiceCommand('6x')).toEqual({ type: 'append', tokens: ['6x'] });
  });

  it('writes a complete inequality', () => {
    expect(parseVoiceCommand('2x plus 1 greater than 7')).toEqual({
      type: 'write-equation',
      equation: '2x+1>7',
    });
  });
});
