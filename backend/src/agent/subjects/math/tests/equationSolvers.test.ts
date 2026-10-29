/**
 * Unit tests for common equation solvers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  solveExponential,
  solveAbsoluteValue,
  solveSimultaneous,
} from '../../../../services/math/StepSolver';

describe('StepSolver — exponential', () => {
  it('solves 2^x = 16', () => {
    const result = solveExponential('2^x = 16');
    assert.ok(result.answers.some((a: string) => a.includes('4')));
  });

  it('solves 3^(x+1) = 27', () => {
    const result = solveExponential('3^(x+1) = 27');
    assert.ok(result.answers.some((a: string) => a.includes('2')));
  });

  it('solves same-base 2^x = 2^4', () => {
    const result = solveExponential('2^x = 2^4');
    assert.ok(result.answers.some((a: string) => /x\s*=\s*4/.test(a)));
    assert.ok(result.steps.some((s) => /equate the exponents/i.test(s.title)));
  });

  it('solves OCR LaTeX braces 2^{x}=2^{4}', () => {
    const result = solveExponential('2^{x}=2^{4}');
    assert.ok(result.answers.some((a: string) => /x\s*=\s*4/.test(a)));
  });

  it('solves unicode superscripts 2ˣ = 2⁴', () => {
    const result = solveExponential('2ˣ = 2⁴');
    assert.ok(result.answers.some((a: string) => /x\s*=\s*4/.test(a)));
  });
});

describe('StepSolver — absolute value', () => {
  it('solves |2x - 3| = 7', () => {
    const result = solveAbsoluteValue('|2x-3|=7');
    assert.equal(result.answers.length, 2);
  });
});

describe('StepSolver — simultaneous', () => {
  it('solves 2x + y = 7 and x - y = 1', () => {
    const result = solveSimultaneous('2x+y=7; x-y=1');
    assert.ok(result.answers.some((a: string) => /x\s*=\s*2\.6667|x\s*=\s*8\/3/.test(a)));
    assert.ok(result.answers.some((a: string) => /y\s*=\s*1\.6667|y\s*=\s*5\/3/.test(a)));
  });
});
