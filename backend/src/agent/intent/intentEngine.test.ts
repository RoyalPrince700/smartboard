import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { intentEngine, detectIntent, INTENT_CONFIDENCE_THRESHOLD } from './intentEngine';
import { TutorSessionData } from '../schemas/conversation.schema';

function session(overrides: Partial<TutorSessionData> = {}): TutorSessionData {
  return {
    sessionId: 'test',
    currentStep: 1,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    subject: 'math',
    topic: 'quadratic',
    ...overrides,
  } as TutorSessionData;
}

function activeProblemSession(): TutorSessionData {
  return session({
    currentProblem: {
      rawInput: '2x^2 + 5x - 3 = 0',
      coefficients: { a: 2, b: 5, c: -3 },
      problemType: 'quadratic',
    },
  });
}

describe('intentEngine — START_PROBLEM', () => {
  it('detects solve equation without active problem', () => {
    const result = detectIntent('Solve 2x^2 + 5x - 3 = 0', session());
    assert.equal(result.intent, 'START_PROBLEM');
    assert.ok(result.confidence >= INTENT_CONFIDENCE_THRESHOLD);
  });

  it('does not re-start when problem already active', () => {
    const result = detectIntent('Solve 2x^2 + 5x - 3 = 0', activeProblemSession());
    assert.notEqual(result.intent, 'START_PROBLEM');
  });
});

describe('intentEngine — CONTINUE', () => {
  it('detects Continue with active problem', () => {
    const result = detectIntent('Continue', activeProblemSession());
    assert.equal(result.intent, 'CONTINUE');
    assert.ok(result.confidence >= 0.9);
  });

  it('detects okay/yes as CONTINUE with active problem', () => {
    assert.equal(detectIntent('Okay', activeProblemSession()).intent, 'CONTINUE');
    assert.equal(detectIntent('Yes', activeProblemSession()).intent, 'CONTINUE');
  });

  it('returns UNKNOWN for Continue without active problem', () => {
    const result = detectIntent('Continue', session());
    assert.equal(result.intent, 'UNKNOWN');
  });

  it('detects Continue after unresolved question', () => {
    const result = detectIntent('Yes', session({ unresolvedQuestion: 'ASK_WHY' }));
    assert.equal(result.intent, 'CONTINUE');
  });
});

describe('intentEngine — ASK_WHY', () => {
  it('detects Why is b 5? with active problem', () => {
    const result = detectIntent('Why is b 5?', activeProblemSession());
    assert.equal(result.intent, 'ASK_WHY');
    assert.ok(result.confidence >= 0.9);
    assert.equal(result.metadata?.coefficient, 'b');
  });

  it('detects why without active problem', () => {
    const result = detectIntent('Why does the discriminant matter?', session());
    assert.equal(result.intent, 'ASK_WHY');
  });
});

describe('intentEngine — explanations and definitions', () => {
  it('detects REQUEST_SIMPLER_EXPLANATION', () => {
    const result = detectIntent("I don't understand discriminant", activeProblemSession());
    assert.equal(result.intent, 'REQUEST_SIMPLER_EXPLANATION');
  });

  it('detects ASK_DEFINITION', () => {
    const result = detectIntent('What is the discriminant?', session());
    assert.equal(result.intent, 'ASK_DEFINITION');
  });

  it('detects ASK_EXPLANATION', () => {
    const result = detectIntent('Explain factorization', session());
    assert.equal(result.intent, 'ASK_EXPLANATION');
  });

  it('detects ASK_HOW', () => {
    const result = detectIntent('How do I factorize this?', activeProblemSession());
    assert.equal(result.intent, 'ASK_HOW');
  });
});

describe('intentEngine — hints, methods, answers', () => {
  it('detects REQUEST_HINT with active problem', () => {
    assert.equal(detectIntent('Give me a hint', activeProblemSession()).intent, 'REQUEST_HINT');
  });

  it('detects ASK_ALTERNATIVE_METHOD for factorization', () => {
    const result = detectIntent('Can I use factorization?', activeProblemSession());
    assert.equal(result.intent, 'ASK_ALTERNATIVE_METHOD');
  });

  it('detects SUBMIT_ANSWER', () => {
    const result = detectIntent('x = -3 or x = 0.5', activeProblemSession());
    assert.equal(result.intent, 'SUBMIT_ANSWER');
  });

  it('detects CHECK_ANSWER', () => {
    const result = detectIntent('Is my answer correct?', activeProblemSession());
    assert.equal(result.intent, 'CHECK_ANSWER');
  });
});

describe('intentEngine — navigation', () => {
  it('detects GO_BACK', () => {
    assert.equal(detectIntent('Go back', activeProblemSession()).intent, 'GO_BACK');
  });

  it('detects REPEAT', () => {
    assert.equal(detectIntent('Say that again', session()).intent, 'REPEAT');
  });

  it('detects REQUEST_PRACTICE', () => {
    assert.equal(detectIntent('Give me another question', session()).intent, 'REQUEST_PRACTICE');
  });

  it('detects REQUEST_EXAMPLE', () => {
    assert.equal(detectIntent('Show me an example', session()).intent, 'REQUEST_EXAMPLE');
  });

  it('detects CHANGE_TOPIC', () => {
    assert.equal(detectIntent("Let's study linear equations", session()).intent, 'CHANGE_TOPIC');
  });
});

describe('intentEngine — UNKNOWN', () => {
  it('returns UNKNOWN for empty input', () => {
    assert.equal(intentEngine.detect('').intent, 'UNKNOWN');
  });

  it('returns UNKNOWN for ambiguous gibberish', () => {
    const result = intentEngine.detect('hmm maybe idk', session());
    assert.equal(result.intent, 'UNKNOWN');
  });

  it('returns UNKNOWN for hint without active problem', () => {
    const result = detectIntent('Give me a hint', session());
    assert.equal(result.intent, 'UNKNOWN');
  });
});

describe('intentEngine — math subject detectors', () => {
  it('boosts START_PROBLEM for math equations via subject detector', () => {
    const result = detectIntent('2x^2 + 5x - 3 = 0', session({ subject: 'math' }));
    assert.equal(result.intent, 'START_PROBLEM');
    assert.ok(result.confidence >= 0.88);
  });
});
