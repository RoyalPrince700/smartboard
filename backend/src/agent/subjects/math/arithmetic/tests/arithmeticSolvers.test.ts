/**
 * Unit tests for basic arithmetic expressions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression } from '../../shared/equationAdapter';
import { defaultArithmeticSolver } from '../solvers';
import { createAgentContext } from '../../../../core/agentContext';
import { createEmptySession } from '../../../../schemas/conversation.schema';
import { isArithmeticExpression } from '../index';
import { detectIntent } from '../../../../intent/intentEngine';

describe('arithmetic — expression detection', () => {
  it('detects chained addition with trailing equals', () => {
    assert.equal(isArithmeticExpression('4+2+4 ='), true);
  });

  it('detects expressions without equals', () => {
    assert.equal(isArithmeticExpression('3 * 5 + 2'), true);
  });

  it('rejects variable equations', () => {
    assert.equal(isArithmeticExpression('2x + 3 = 7'), false);
  });
});

describe('StepSolver — evaluateExpression', () => {
  it('evaluates 4+2+4 =', () => {
    const result = evaluateExpression('4+2+4 =');
    assert.equal(result.answers[0], '10');
    assert.ok(result.steps.length >= 3);
  });

  it('evaluates order-of-operations expressions', () => {
    const result = evaluateExpression('3 + 5 * 2 =');
    assert.equal(result.answers[0], '13');
  });
});

describe('arithmetic agent solver', () => {
  it('returns numeric answer for 4+2+4 =', () => {
    const session = createEmptySession('test-session');
    const context = createAgentContext('4+2+4 =', session, {
      intent: 'START_PROBLEM',
      confidence: 0.94,
    });
    const trace = defaultArithmeticSolver(context);
    assert.equal(trace.problemType, 'arithmetic');
    assert.equal(trace.conclusion?.answer, '10');
  });
});

describe('intentEngine — arithmetic START_PROBLEM', () => {
  it('starts arithmetic problems from numeric expressions', () => {
    const session = createEmptySession('test-session');
    session.subject = 'math';
    session.topic = 'quadratic';

    const result = detectIntent('4+2+4 =', session);
    assert.equal(result.intent, 'START_PROBLEM');
    assert.ok(result.confidence >= 0.9);
  });
});
