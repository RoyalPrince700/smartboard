import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contextManager } from './contextManager';
import { TutorSessionData } from '../schemas/conversation.schema';

function mockSession(overrides: Partial<TutorSessionData> = {}): TutorSessionData {
  return {
    sessionId: 'test-session',
    currentStep: 2,
    completedSteps: [{ step: 0, title: 'Identify coefficients', completedAt: new Date() }],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    currentProblem: {
      rawInput: '2x^2 + 5x - 3 = 0',
      coefficients: { a: 2, b: 5, c: -3 },
      problemType: 'quadratic',
    },
    ...overrides,
  } as TutorSessionData;
}

describe('contextManager', () => {
  it('resolves coefficient b from active problem for "Why is b 5?"', () => {
    const session = mockSession();
    const result = contextManager.resolve('Why is b 5?', session, 'ASK_WHY');

    assert.equal(result.references.b, 5);
    assert.equal(result.references.concept, 'coefficient_b');
    assert.equal(result.refersToActiveProblem, true);
  });

  it('resolves all coefficients when referring to "this equation"', () => {
    const session = mockSession();
    const result = contextManager.resolve('Explain this equation', session);

    assert.equal(result.references.activeProblem, true);
    assert.equal(result.references.a, 2);
    assert.equal(result.references.b, 5);
    assert.equal(result.references.c, -3);
  });

  it('detects discriminant concept reference', () => {
    const session = mockSession();
    const result = contextManager.resolve("I don't understand discriminant", session);

    assert.equal(result.references.currentConcept, 'discriminant');
    assert.equal(result.currentConcept, 'discriminant');
  });

  it('includes current step in references', () => {
    const session = mockSession({ currentStep: 3 });
    const result = contextManager.resolve('What is this step?', session);

    assert.equal(result.references.currentStep, 3);
    assert.equal(result.references.referenceType, 'current_step');
  });

  it('detects continuation from "Continue"', () => {
    const session = mockSession();
    const result = contextManager.resolve('Continue', session, 'CONTINUE');

    assert.equal(result.impliesContinuation, true);
  });

  it('does not refer to active problem without context', () => {
    const session = mockSession({ currentProblem: undefined });
    const result = contextManager.resolve('What is a quadratic?', session);

    assert.equal(result.refersToActiveProblem, false);
    assert.equal(result.references.b, undefined);
  });

  it('does not mutate session during resolution', () => {
    const session = mockSession({ currentConcept: undefined });
    contextManager.resolve("I don't understand discriminant", session);
    assert.equal(session.currentConcept, undefined);
  });
});
