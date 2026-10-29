/**
 * Unit tests for quadratic solvers — parsing, coefficients, discriminant, formula, factorization.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractQuadraticFromInput } from '../../shared/equationAdapter';
import { parseToTrace } from '../solvers/parser';
import {
  calculateDiscriminant,
  classifyDiscriminant,
  discriminantStep,
} from '../solvers/discriminantCalculator';
import { solveByQuadraticFormula } from '../solvers/quadraticFormulaSolver';
import {
  findFactorPair,
  isFactorizable,
  solveByFactorization,
} from '../solvers/factorizationSolver';
import { verifyRoots } from '../solvers/rootVerifier';
import {
  defaultQuadraticSolver,
  factorizationSolver,
  quadraticFormulaSolver,
} from '../solvers/index';
import { createAgentContext } from '../../../../core/agentContext';
import { TutorSessionData } from '../../../../schemas/conversation.schema';

function makeContext(message: string) {
  const session = {
    sessionId: 'test',
    currentStep: 0,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    subject: 'math',
    topic: 'quadratic',
  } as TutorSessionData;

  return createAgentContext(message, session, { intent: 'START_PROBLEM', confidence: 0.9 });
}

describe('quadratic — extractQuadraticFromInput', () => {
  it('extracts coefficients for 2x^2 + 5x - 3 = 0', () => {
    const result = extractQuadraticFromInput('2x^2 + 5x - 3 = 0');
    assert.ok(result);
    assert.equal(result!.a, 2);
    assert.equal(result!.b, 5);
    assert.equal(result!.c, -3);
  });

  it('returns null for linear input', () => {
    assert.equal(extractQuadraticFromInput('2x + 3 = 0'), null);
  });
});

describe('quadratic — parseToTrace', () => {
  it('builds parse trace with recognized data', () => {
    const trace = parseToTrace('2x^2 + 5x - 3 = 0');
    assert.ok(trace);
    assert.equal(trace!.problemType, 'quadratic');
    assert.equal(trace!.recognizedData?.a, 2);
    assert.equal(trace!.recognizedData?.b, 5);
    assert.equal(trace!.recognizedData?.c, -3);
  });
});

describe('quadratic — discriminant', () => {
  it('calculates discriminant for 2x^2 + 5x - 3', () => {
    assert.equal(calculateDiscriminant(2, 5, -3), 49);
  });

  it('classifies positive discriminant', () => {
    const { rootType, rootCount } = classifyDiscriminant(49);
    assert.equal(rootType, 'real_distinct');
    assert.equal(rootCount, 2);
  });

  it('classifies zero discriminant', () => {
    const { rootType, rootCount } = classifyDiscriminant(0);
    assert.equal(rootType, 'real_repeated');
    assert.equal(rootCount, 1);
  });

  it('classifies negative discriminant', () => {
    const { rootType, rootCount } = classifyDiscriminant(-4);
    assert.equal(rootType, 'complex');
    assert.equal(rootCount, 0);
  });

  it('adds discriminant step to trace', () => {
    const trace = discriminantStep(2, 5, -3);
    assert.equal(trace.recognizedData?.discriminant, 49);
    assert.ok(trace.reasoningSteps?.length);
  });
});

describe('quadratic — quadratic formula', () => {
  it('solves 2x^2 + 5x - 3 = 0', () => {
    const trace = solveByQuadraticFormula(2, 5, -3);
    const roots = trace.recognizedData?.roots as number[];
    assert.deepEqual(roots, [0.5, -3]);
    assert.equal(trace.recognizedData?.discriminant, 49);
  });

  it('returns no real roots when discriminant < 0', () => {
    const trace = solveByQuadraticFormula(1, 0, 1);
    assert.deepEqual(trace.recognizedData?.roots, []);
    assert.equal(trace.recognizedData?.rootType, 'complex');
  });

  it('returns repeated root when discriminant = 0', () => {
    const trace = solveByQuadraticFormula(1, -2, 1);
    assert.deepEqual(trace.recognizedData?.roots, [1]);
  });
});

describe('quadratic — factorization', () => {
  it('finds factor pair for monic quadratic', () => {
    assert.deepEqual(findFactorPair(6, 5), [2, 3]);
  });

  it('detects factorizable monic equation', () => {
    assert.equal(isFactorizable(1, 5, 6), true);
    assert.equal(isFactorizable(2, 5, -3), false);
  });

  it('solves x^2 + 5x + 6 = 0 by factorization', () => {
    const trace = solveByFactorization(1, 5, 6);
    assert.equal(trace.recognizedData?.factorizable, true);
    assert.deepEqual(trace.recognizedData?.roots, [-3, -2]);
  });

  it('flags non-factorizable quadratics', () => {
    const trace = solveByFactorization(2, 5, -3);
    assert.ok(trace.flags?.includes('factorization_not_applicable'));
  });
});

describe('quadratic — root verification', () => {
  it('verifies roots by substitution', () => {
    assert.equal(verifyRoots(2, 5, -3, [0.5, -3]), true);
    assert.equal(verifyRoots(2, 5, -3, [1, 2]), false);
  });
});

describe('quadratic — solver orchestration', () => {
  it('defaultQuadraticSolver produces full trace for 2x^2 + 5x - 3 = 0', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0');
    const trace = defaultQuadraticSolver(context);

    assert.equal(trace.problemType, 'quadratic');
    assert.equal(trace.recognizedData?.a, 2);
    assert.equal(trace.recognizedData?.discriminant, 49);
    assert.equal(trace.recognizedData?.factorizable, false);
    assert.deepEqual(trace.recognizedData?.roots, [0.5, -3]);
    assert.ok((trace.reasoningSteps?.length ?? 0) >= 3);
  });

  it('quadraticFormulaSolver computes roots', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0');
    const trace = quadraticFormulaSolver(context);
    assert.deepEqual(trace.recognizedData?.roots, [0.5, -3]);
  });

  it('factorizationSolver falls back to formula when not factorizable', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0');
    const trace = factorizationSolver(context);
    assert.deepEqual(trace.recognizedData?.roots, [0.5, -3]);
  });

  it('factorizationSolver uses factorization for monic equations', () => {
    const context = makeContext('x^2 + 5x + 6 = 0');
    const trace = factorizationSolver(context);
    assert.equal(trace.recognizedData?.method, 'factorization');
    assert.deepEqual(trace.recognizedData?.roots, [-3, -2]);
  });
});
