/**
 * Integration test — full reasoning pipeline for quadratic problem.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reasoningEngine } from '../core/reasoningEngine';
import { createAgentContext } from '../core/agentContext';
import { TutorSessionData } from '../schemas/conversation.schema';

function makeContext(
  message: string,
  intent: 'START_PROBLEM' | 'SUBMIT_ANSWER' = 'START_PROBLEM',
  sessionOverrides: Partial<TutorSessionData> = {}
) {
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
    ...sessionOverrides,
  } as TutorSessionData;

  return createAgentContext(message, session, { intent, confidence: 0.9 });
}

describe('reasoningEngine — integration', () => {
  it('produces full trace for quadratic equation', async () => {
    const context = makeContext('2x^2 + 5x - 3 = 0');
    const trace = await reasoningEngine.run(context);

    assert.equal(trace.problemType, 'quadratic');
    assert.equal(trace.recognizedData?.a, 2);
    assert.equal(trace.recognizedData?.b, 5);
    assert.equal(trace.recognizedData?.c, -3);
    assert.equal(trace.recognizedData?.discriminant, 49);
    assert.ok(Array.isArray(trace.recognizedData?.roots));
    assert.ok((trace.appliedRules ?? []).includes('discriminant_positive'));
    assert.equal(trace.selectedMethod, 'quadratic_formula');
    assert.ok(trace.conclusion?.answer);
    assert.ok(trace.reasoningSteps.length >= 4);
    assert.equal(context.pipelineStage, 'complete');
  });

  it('verifies submitted answer against session roots', async () => {
    const solveContext = makeContext('2x^2 + 5x - 3 = 0');
    const solveTrace = await reasoningEngine.run(solveContext);

    const submitContext = makeContext('x = 0.5 or x = -3', 'SUBMIT_ANSWER', {
      currentProblem: {
        rawInput: '2x^2 + 5x - 3 = 0',
        coefficients: { a: 2, b: 5, c: -3 },
        intermediateResults: { roots: solveTrace.recognizedData?.roots },
      },
    });

    const trace = await reasoningEngine.run(submitContext);
    assert.ok(trace.verification);
    assert.equal(trace.verification!.status, 'correct');
  });

  it('flags missing subject/topic', async () => {
    const context = makeContext('hello there', 'START_PROBLEM', {
      subject: undefined,
      topic: undefined,
    });
    const trace = await reasoningEngine.run(context);
    assert.ok(trace.flags?.includes('missing_subject_or_topic'));
  });

  it('does not produce UI text in trace steps', async () => {
    const context = makeContext('2x^2 + 5x - 3 = 0');
    const trace = await reasoningEngine.run(context);

    for (const step of trace.reasoningSteps) {
      assert.ok(!step.description.includes('<'), 'trace should not contain HTML');
      assert.ok(step.action.length > 0);
    }
  });
});
