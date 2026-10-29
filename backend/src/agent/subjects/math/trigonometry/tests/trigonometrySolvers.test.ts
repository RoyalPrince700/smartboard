/**
 * Unit tests for introductory trigonometry solver.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentContext } from '../../../../core/agentContext';
import { TutorSessionData } from '../../../../schemas/conversation.schema';
import { defaultTrigonometrySolver } from '../solvers';

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
    topic: 'trigonometry',
  } as TutorSessionData;

  return createAgentContext(message, session, { intent: 'START_PROBLEM', confidence: 0.9 });
}

describe('trigonometry — defaultTrigonometrySolver', () => {
  it('evaluates sin 30', () => {
    const trace = defaultTrigonometrySolver(makeContext('sin 30'));

    assert.equal(trace.problemType, 'trigonometry');
    assert.equal(trace.recognizedData?.answerDisplay, 'sin(30) = 1/2 = 0.5');
  });

  it('evaluates cos 60 assigned to x', () => {
    const trace = defaultTrigonometrySolver(makeContext('cos 60 = x'));

    assert.equal(trace.recognizedData?.answerDisplay, 'x = 1/2 = 0.5');
  });

  it('solves a common unknown-angle value', () => {
    const trace = defaultTrigonometrySolver(makeContext('sin x = 1/2'));

    assert.equal(trace.recognizedData?.answerDisplay, 'x = 30 degrees or 150 degrees');
  });

  it('solves a triangle diagram with unknown angle', () => {
    const trace = defaultTrigonometrySolver(
      makeContext('[trigonometry] shape=triangle values=2,6 find=unknown_angle angleLabel=θ unit=cm')
    );

    assert.equal(trace.problemType, 'trigonometry');
    assert.equal(trace.recognizedData?.trigTask, 'find_angle_from_sides');
    assert.equal(trace.recognizedData?.answerDisplay, 'θ = 18.4349°');
  });
});
