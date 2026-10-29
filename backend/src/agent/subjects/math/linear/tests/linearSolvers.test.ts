/**
 * Unit tests for linear solver rules integration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultLinearSolver } from '../solvers';
import { linearRules } from '../rules';
import { createAgentContext } from '../../../../core/agentContext';
import { ruleEngine } from '../../../../reasoning/ruleEngine';
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
    topic: 'linear',
  } as TutorSessionData;

  return createAgentContext(message, session, { intent: 'START_PROBLEM', confidence: 0.9 });
}

describe('linear — defaultLinearSolver', () => {
  it('solves 2x + 3 = 7', () => {
    const context = makeContext('2x + 3 = 7');
    const trace = defaultLinearSolver(context);

    assert.equal(trace.problemType, 'linear');
    assert.ok(trace.conclusion?.answer);
    assert.ok((trace.reasoningSteps?.length ?? 0) > 0);
  });

  it('flags parse failure for quadratic input', () => {
    const context = makeContext('x^2 + 1 = 0');
    const trace = defaultLinearSolver(context);
    assert.ok(trace.flags?.includes('parse_failed'));
  });

  it('classifies variables on both sides', () => {
    const context = makeContext('3x - 7 = 2x + 1');
    const trace = defaultLinearSolver(context);
    assert.equal(trace.recognizedData?.equationType, 'variables_both_sides');
  });
});

describe('linear — rules', () => {
  it('applies degree-1 and step breakdown rules', () => {
    const { appliedRules } = ruleEngine.evaluate(linearRules, {
      degree: 1,
      equationType: 'two_step',
    });
    assert.ok(appliedRules.includes('linear_degree_1'));
    assert.ok(appliedRules.includes('linear_jss_step_breakdown'));
    assert.ok(appliedRules.includes('linear_two_step'));
  });
});
