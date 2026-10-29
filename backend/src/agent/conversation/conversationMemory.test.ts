import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { conversationMemory } from './conversationMemory';
import { TutorSessionData } from '../schemas/conversation.schema';

describe('conversationMemory', () => {
  it('appends turns and trims history to max length', () => {
    const session = {
      sessionId: 'test',
      currentStep: 0,
      completedSteps: [],
      teachingMode: 'GUIDED',
      difficulty: 'beginner',
      conversationHistory: [],
      metadata: {},
    } as TutorSessionData;

    for (let i = 0; i < 55; i++) {
      conversationMemory.appendTurn(session, {
        role: 'student',
        content: `message ${i}`,
        timestamp: new Date(),
      });
    }

    assert.equal(session.conversationHistory.length, 50);
    assert.equal(session.conversationHistory[0].content, 'message 5');
  });

  it('summarizes conversation state', () => {
    const session = {
      sessionId: 'test',
      currentStep: 2,
      completedSteps: [],
      teachingMode: 'GUIDED',
      difficulty: 'beginner',
      topic: 'quadratic',
      conversationHistory: [
        { role: 'student', content: 'Solve 2x^2+5x-3=0', intent: 'START_PROBLEM', timestamp: new Date() },
        { role: 'tutor', content: 'Let us identify coefficients', timestamp: new Date() },
      ],
      metadata: {},
      currentProblem: { rawInput: '2x^2+5x-3=0' },
    } as TutorSessionData;

    const summary = conversationMemory.summarize(session);
    assert.equal(summary.turnCount, 2);
    assert.equal(summary.hasActiveProblem, true);
    assert.equal(summary.currentStep, 2);
    assert.equal(summary.lastStudentIntent, 'START_PROBLEM');
  });

  it('updates session metadata with summary', () => {
    const session = {
      sessionId: 'test',
      currentStep: 0,
      completedSteps: [],
      teachingMode: 'GUIDED',
      difficulty: 'beginner',
      conversationHistory: [],
      metadata: { existing: true },
    } as TutorSessionData;

    conversationMemory.updateSessionMetadata(session);
    assert.equal(session.metadata.existing, true);
    assert.ok(session.metadata.conversationSummary);
    assert.ok(session.metadata.lastUpdatedAt);
  });
});
