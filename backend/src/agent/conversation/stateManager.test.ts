import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stateManager } from './stateManager';
import { TutorSessionData } from '../schemas/conversation.schema';
import { ReasoningTrace } from '../schemas/reasoning.schema';

function emptySession(): TutorSessionData {
  return {
    sessionId: 'test',
    currentStep: 0,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
  } as TutorSessionData;
}

const quadraticTrace: ReasoningTrace = {
  problemType: 'quadratic',
  recognizedData: { a: 2, b: 5, c: -3, discriminant: 49 },
  reasoningSteps: [],
};

describe('stateManager', () => {
  it('initializes problem on START_PROBLEM', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, '2x^2 + 5x - 3 = 0');

    assert.equal(session.currentProblem?.rawInput, '2x^2 + 5x - 3 = 0');
    assert.deepEqual(session.currentProblem?.coefficients, { a: 2, b: 5, c: -3 });
    assert.equal(session.currentStep, 0);
    assert.equal(session.completedSteps.length, 0);
  });

  it('advances step on CONTINUE', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, '2x^2 + 5x - 3 = 0');

    stateManager.applyIntentTransition(session, 'CONTINUE', quadraticTrace);
    assert.equal(session.currentStep, 1);
    assert.equal(session.completedSteps.length, 1);
    assert.equal(session.completedSteps[0].step, 0);
  });

  it('goes back one step on GO_BACK', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, 'input');
    stateManager.applyIntentTransition(session, 'CONTINUE', quadraticTrace);
    stateManager.applyIntentTransition(session, 'CONTINUE', quadraticTrace);
    assert.equal(session.currentStep, 2);

    stateManager.applyIntentTransition(session, 'GO_BACK', quadraticTrace);
    assert.equal(session.currentStep, 1);
    assert.equal(session.completedSteps.length, 1);
  });

  it('resets problem on REQUEST_PRACTICE', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, 'input');
    stateManager.applyIntentTransition(session, 'REQUEST_PRACTICE', quadraticTrace);

    assert.equal(session.currentProblem, undefined);
    assert.equal(session.currentStep, 0);
  });

  it('tracks unresolved question for ASK_WHY', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, 'input');
    stateManager.applyIntentTransition(session, 'ASK_WHY', quadraticTrace);

    assert.equal(session.unresolvedQuestion, 'ASK_WHY');

    stateManager.applyIntentTransition(session, 'CONTINUE', quadraticTrace);
    assert.equal(session.unresolvedQuestion, undefined);
  });

  it('returns current step info from pipeline', () => {
    const session = emptySession();
    session.topic = 'quadratic';
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, 'input');

    const step = stateManager.getCurrentStepInfo(session);
    assert.ok(step);
    assert.equal(step.id, 'identify_coefficients');
    assert.equal(step.isComplete, false);
  });

  it('stores discriminant in intermediate results', () => {
    const session = emptySession();
    stateManager.applyIntentTransition(session, 'START_PROBLEM', quadraticTrace, 'input');

    assert.equal(session.currentProblem?.intermediateResults?.discriminant, 49);
  });
});
