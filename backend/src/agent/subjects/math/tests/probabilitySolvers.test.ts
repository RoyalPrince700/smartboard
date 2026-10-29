/**
 * Unit tests for probability solvers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { solveProbability, looksLikeProbability } from '../../../../services/math/ProbabilitySolver';

describe('ProbabilitySolver — detection', () => {
  it('detects probability keywords', () => {
    assert.equal(looksLikeProbability('What is the probability of rolling an even number on a die?'), true);
    assert.equal(looksLikeProbability('2x + 3 = 7'), false);
  });
});

describe('ProbabilitySolver — basic', () => {
  it('solves 3 out of 10', () => {
    const result = solveProbability('probability of 3 out of 10');
    assert.ok(result.answers.some((a) => /3\/10/.test(a)));
    assert.equal(result.kind, 'basic_ratio');
  });

  it('solves bag draw', () => {
    const result = solveProbability('A bag has 5 red and 3 blue marbles. What is the probability of picking a red marble?');
    assert.ok(result.answers.some((a) => /5\/8/.test(a)));
    assert.equal(result.kind, 'bag_draw');
  });

  it('solves die even number', () => {
    const result = solveProbability('probability of rolling an even number on a die');
    assert.ok(result.answers.some((a) => /1\/2/.test(a)));
    assert.equal(result.kind, 'die');
  });

  it('solves coin toss', () => {
    const result = solveProbability('probability of getting heads when tossing a coin');
    assert.ok(result.answers.some((a) => /1\/2/.test(a)));
    assert.equal(result.kind, 'coin');
  });
});

describe('ProbabilitySolver — rules', () => {
  it('solves complement P(not A) when P(A)=0.3', () => {
    const result = solveProbability('P(A) = 0.3 find P(not A)');
    assert.ok(result.answers.some((a) => /0\.7/.test(a)));
    assert.equal(result.kind, 'complement');
  });

  it('solves independent AND', () => {
    const result = solveProbability('P(A) = 0.4 and P(B) = 0.5 find P(A and B) independent events');
    assert.ok(result.answers.some((a) => /0\.2/.test(a)));
    assert.equal(result.kind, 'independent_and');
  });

  it('solves mutually exclusive OR', () => {
    const result = solveProbability('P(A) = 0.3 P(B) = 0.2 mutually exclusive find P(A or B)');
    assert.ok(result.answers.some((a) => /0\.5/.test(a)));
    assert.equal(result.kind, 'mutually_exclusive_or');
  });
});

describe('ProbabilitySolver — counting', () => {
  it('solves C(10,3)', () => {
    const result = solveProbability('C(10,3)');
    assert.ok(result.answers.some((a) => /120/.test(a)));
    assert.equal(result.kind, 'combination');
  });

  it('solves 10 choose 3', () => {
    const result = solveProbability('how many ways to choose 3 from 10');
    assert.ok(result.answers.some((a) => /120/.test(a)));
  });

  it('solves 5P2', () => {
    const result = solveProbability('5P2');
    assert.ok(result.answers.some((a) => /20/.test(a)));
    assert.equal(result.kind, 'permutation');
  });
});
