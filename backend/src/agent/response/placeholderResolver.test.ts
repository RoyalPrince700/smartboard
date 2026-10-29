/**
 * Unit tests for placeholder resolution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentContext } from '../core/agentContext';
import { TutorSessionData } from '../schemas/conversation.schema';
import {
  buildPlaceholderMap,
  resolvePlaceholders,
  hasUnresolvedPlaceholders,
} from './placeholderResolver';

function makeContext(coefficients = { a: 2, b: 5, c: -3 }) {
  const session = {
    sessionId: 'test',
    currentStep: 2,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    subject: 'math',
    topic: 'quadratic',
    currentConcept: 'discriminant',
    currentProblem: {
      rawInput: '2x^2 + 5x - 3 = 0',
      coefficients,
      intermediateResults: { discriminant: 49 },
    },
  } as TutorSessionData;

  const context = createAgentContext('test', session, {
    intent: 'ASK_WHY',
    confidence: 0.9,
  });
  context.reasoningTrace.recognizedData = {
    a: 2,
    b: 5,
    c: -3,
    discriminant: 49,
    variable: 'x',
  };
  context.resolvedReferences = { stepTitle: 'Calculate the discriminant' };
  return context;
}

describe('placeholderResolver', () => {
  it('builds map from coefficients and recognized data', () => {
    const map = buildPlaceholderMap(makeContext());
    assert.equal(map.a, 2);
    assert.equal(map.b, 5);
    assert.equal(map.c, -3);
    assert.equal(map.discriminant, 49);
    assert.equal(map.currentStep, 2);
    assert.equal(map.currentConcept, 'discriminant');
    assert.equal(map.variable, 'x');
  });

  it('resolves coefficient placeholders in content', () => {
    const map = buildPlaceholderMap(makeContext());
    const result = resolvePlaceholders(
      'In {{a}}x² + {{b}}x + {{c}} = 0, b = {{b}}.',
      map
    );
    assert.equal(result, 'In 2x² + 5x + -3 = 0, b = 5.');
    assert.equal(hasUnresolvedPlaceholders(result), false);
  });

  it('resolves session placeholders', () => {
    const map = buildPlaceholderMap(makeContext());
    const result = resolvePlaceholders('Step {{currentStep}}: {{currentConcept}}', map);
    assert.equal(result, 'Step 2: discriminant');
  });

  it('replaces unknown placeholders with empty string', () => {
    const result = resolvePlaceholders('Value: {{missing}}', {});
    assert.equal(result, 'Value: ');
  });
});
