import { describe, expect, it } from 'vitest';
import { tokenizeMathSpeech } from './mathTokenizer';
import { isHypothesisBreak, isMathRegression, mergeIntoPersistentBuffer } from './persistentMathBuffer';
import { formatMathTokens } from './mathTokenizer';

function merge(existing: string, incoming: string): string {
  const buffer = tokenizeMathSpeech(existing);
  const previous = buffer[buffer.length - 1]?.value;
  const hasEquals = buffer.some((token) => token.kind === 'equals');
  return formatMathTokens(
    mergeIntoPersistentBuffer(buffer, tokenizeMathSpeech(incoming, previous, hasEquals))
  );
}

describe('persistent math buffer', () => {
  it('joins a coefficient and a later variable', () => {
    expect(merge('2', 'x')).toBe('2x');
    expect(merge('2', 'ex')).toBe('2x');
    expect(merge('2', 's')).toBe('2x');
  });

  it('is monotonic against weaker finals', () => {
    expect(merge('2x', '2')).toBe('2x');
    expect(merge('2x - 5', '2x')).toBe('2x - 5');
  });

  it('does not duplicate a restated segment', () => {
    expect(merge('2x', '2x')).toBe('2x');
    expect(merge('2x -', '-')).toBe('2x -');
  });

  it('does not turn equals fragments into x or e', () => {
    expect(merge('2x', 'e')).toBe('2x');
    expect(merge('2x', 'es')).toBe('2x');
    expect(merge('2x', 's')).toBe('2x');
    expect(merge('2x', 'equals')).toBe('2x =');
    expect(merge('2x', 'is')).toBe('2x =');
  });

  it('appends operators and terms across pauses', () => {
    expect(merge('2x', 'minus')).toBe('2x -');
    expect(merge('2x -', '5')).toBe('2x - 5');
    expect(merge('2x - 5', 'equals')).toBe('2x - 5 =');
    expect(merge('3 + 4 =', 'equals')).toBe('3 + 4 =');
    expect(merge('4 + 5 =', '4')).toBe('4 + 5 =');
    expect(merge('2x - 5 =', 'x')).toBe('2x - 5 = x');
    expect(merge('2x - 5 = x', 'plus')).toBe('2x - 5 = x +');
    expect(merge('2x - 5 = x +', '2')).toBe('2x - 5 = x + 2');
  });

  it('raises a committed digit to x or another digit across pauses', () => {
    expect(merge('2', 'raise to power x')).toBe('2^x');
    expect(merge('2', 'to the power of 3')).toBe('2^3');
    expect(merge('2', 'to the x')).toBe('2^x');
  });

  it('joins y and a second equation after comma or and', () => {
    expect(merge('2x', 'y')).toBe('2x + y');
    expect(merge('2x + y = 7', 'comma')).toBe('2x + y = 7,');
    expect(merge('2x + y = 7', 'and x minus y equals 1')).toBe('2x + y = 7, x - y = 1');
  });

  it('joins z, pi r, groups, and delayed roots', () => {
    expect(merge('x + y', 'z')).toBe('x + y + z');
    expect(merge('2', 'pi r')).toBe('2pi*r');
    expect(merge('2pi', 'r')).toBe('2pi*r');
    expect(merge('(x+1)', '(x-2) equals 0')).toBe('(x+1)(x-2) = 0');
    expect(
      merge('open bracket x plus 1 close bracket', 'open bracket x minus 2 close bracket equals 0')
    ).toBe('(x+1)(x-2) = 0');
    expect(merge('sqrt', 'x plus 4 equals 5')).toBe('sqrt(x+4) = 5');
    expect(merge('sin', 'x')).toBe('sin(x)');
  });

  it('detects regressions that destroy information', () => {
    expect(isMathRegression(tokenizeMathSpeech('2x'), tokenizeMathSpeech('2'))).toBe(true);
    expect(isMathRegression(tokenizeMathSpeech('2x - 5'), tokenizeMathSpeech('2x'))).toBe(true);
    expect(isMathRegression(tokenizeMathSpeech('2'), tokenizeMathSpeech('2x'))).toBe(false);
  });

  it('treats Chrome replacing 2 with x as a new fragment, not a rewrite', () => {
    expect(isHypothesisBreak(tokenizeMathSpeech('2'), tokenizeMathSpeech('x'))).toBe(true);
    expect(isHypothesisBreak(tokenizeMathSpeech('2x'), tokenizeMathSpeech('minus'))).toBe(true);
    expect(isHypothesisBreak(tokenizeMathSpeech('2'), tokenizeMathSpeech('2x'))).toBe(false);
    expect(isHypothesisBreak(tokenizeMathSpeech('2x'), tokenizeMathSpeech('2'))).toBe(false);
  });
});
