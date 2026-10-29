/**
 * Unit tests for teaching engine — mode selection and presentation rules.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { teachingEngine, TEACHING_MODES } from '../core/teachingEngine';
import { createAgentContext } from '../core/agentContext';
import { responseBuilder } from '../core/responseBuilder';
import { TutorSessionData } from '../schemas/conversation.schema';
import { KnowledgeDocument } from '../knowledge/knowledgeLoader';
import { getPresentationForMode } from '../teaching/modeHandlers';

function makeContext(
  message: string,
  intent: Parameters<typeof createAgentContext>[2]['intent'],
  overrides: Partial<TutorSessionData> = {}
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
    ...overrides,
  } as TutorSessionData;

  const context = createAgentContext(message, session, { intent, confidence: 0.9 });
  context.reasoningTrace = {
    reasoningSteps: [
      { order: 1, action: 'parse', description: 'Parsed equation' },
      { order: 2, action: 'calculate_discriminant', description: 'Discriminant = 49', data: { expression: '5^2 - 4(2)(-3)' } },
      { order: 3, action: 'calculate_roots', description: 'x = 0.5 or x = -3' },
    ],
    recognizedData: { a: 2, b: 5, c: -3, discriminant: 49, roots: [0.5, -3] },
    problemType: 'quadratic',
    conclusion: { answer: [0.5, -3], answerDisplay: 'x = 0.5 or x = -3' },
  };
  context.resolvedReferences = { stepId: 'discriminant', stepTitle: 'Calculate the discriminant' };
  return context;
}

describe('teachingEngine — mode selection', () => {
  it('exposes all six teaching modes', () => {
    assert.deepEqual([...TEACHING_MODES], [
      'DIRECT', 'GUIDED', 'SOCRATIC', 'HINT', 'EXAM', 'PRACTICE',
    ]);
  });

  it('selects GUIDED for START_PROBLEM', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0', 'START_PROBLEM');
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'GUIDED');
    assert.equal(action.presentation.includeAnswer, false);
  });

  it('selects HINT for REQUEST_HINT', () => {
    const context = makeContext('give me a hint', 'REQUEST_HINT');
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'HINT');
    assert.deepEqual(action.presentation.knowledgeTypes, ['hint']);
    assert.equal(action.presentation.includeReasoningSteps, false);
  });

  it('selects EXAM for SUBMIT_ANSWER', () => {
    const context = makeContext('x = 0.5', 'SUBMIT_ANSWER');
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'EXAM');
    assert.equal(action.presentation.includeVerification, true);
    assert.equal(action.presentation.maxKnowledgeDocs, 0);
  });

  it('selects DIRECT for ASK_DEFINITION', () => {
    const context = makeContext('what is the discriminant', 'ASK_DEFINITION');
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'DIRECT');
    assert.ok(action.contentKeys.includes('definition'));
  });

  it('selects PRACTICE for REQUEST_PRACTICE', () => {
    const context = makeContext('give me practice', 'REQUEST_PRACTICE');
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'PRACTICE');
  });

  it('uses session teachingMode as fallback for unknown intents', () => {
    const context = makeContext('hello', 'UNKNOWN', { teachingMode: 'SOCRATIC' });
    const action = teachingEngine.selectAction(context);
    assert.equal(action.mode, 'SOCRATIC');
    assert.equal(action.presentation.addSocraticPrompt, true);
  });
});

describe('teachingEngine — difficulty adaptation', () => {
  it('expands knowledge for beginner requesting simpler explanation', () => {
    const context = makeContext('explain simpler', 'REQUEST_SIMPLER_EXPLANATION', {
      difficulty: 'beginner',
    });
    const action = teachingEngine.selectAction(context);
    assert.ok(action.presentation.knowledgeTypes.includes('explanation'));
    assert.ok(action.presentation.maxKnowledgeDocs >= 2);
  });

  it('reduces hints for advanced difficulty', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0', 'START_PROBLEM', {
      difficulty: 'advanced',
    });
    const action = teachingEngine.selectAction(context);
    assert.ok(!action.presentation.knowledgeTypes.includes('teaching_note'));
  });
});

describe('teachingEngine — same solver, different modes', () => {
  const mockKnowledge: KnowledgeDocument[] = [
    {
      subject: 'math',
      topic: 'quadratic',
      knowledgeType: 'hint',
      difficulty: 'beginner',
      title: 'Discriminant hint',
      content: 'Compute b² − 4ac first.',
      subtopic: 'discriminant',
      tags: ['discriminant'],
      intents: ['REQUEST_HINT'],
    },
    {
      subject: 'math',
      topic: 'quadratic',
      knowledgeType: 'definition',
      difficulty: 'beginner',
      title: 'Discriminant definition',
      content: 'The discriminant is b² − 4ac.',
      subtopic: 'discriminant',
      tags: ['discriminant'],
      intents: ['ASK_DEFINITION'],
    },
  ];

  it('GUIDED hides answer and limits reasoning to current step', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0', 'CONTINUE');
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.equal(context.teachingAction.mode, 'GUIDED');
    assert.ok(response.blocks.some((b) => b.type === 'question'));
    assert.ok(!response.blocks.some((b) => b.type === 'answer'));
  });

  it('DIRECT includes answer and more reasoning', () => {
    const context = makeContext('2x^2 + 5x - 3 = 0', 'ASK_EXPLANATION');
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.equal(context.teachingAction.mode, 'DIRECT');
    assert.ok(response.blocks.some((b) => b.type === 'answer'));
  });

  it('HINT surfaces only hint knowledge', () => {
    const context = makeContext('hint please', 'REQUEST_HINT');
    context.loadedKnowledge = mockKnowledge;
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.equal(context.teachingAction.mode, 'HINT');
    assert.ok(response.blocks.some((b) => b.type === 'hint'));
    assert.ok(!response.blocks.some((b) => b.type === 'answer'));
    assert.ok(!response.blocks.some((b) => b.type === 'calculation'));
  });

  it('EXAM shows verification without hints or coefficients', () => {
    const context = makeContext('x = 0.5', 'SUBMIT_ANSWER');
    context.reasoningTrace.verification = {
      status: 'correct',
      feedback: 'Correct!',
    };
    context.loadedKnowledge = mockKnowledge;
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.equal(context.teachingAction.mode, 'EXAM');
    assert.ok(response.blocks.some((b) => b.type === 'verification'));
    assert.ok(!response.blocks.some((b) => b.type === 'hint'));
  });
});

describe('modeHandlers — presentation profiles', () => {
  it('DIRECT shows all reasoning steps', () => {
    const p = getPresentationForMode('DIRECT', 'ASK_EXPLANATION');
    assert.equal(p.reasoningStepFilter, 'all');
    assert.equal(p.includeAnswer, true);
  });

  it('SOCRATIC adds prompt and hides reasoning', () => {
    const p = getPresentationForMode('SOCRATIC', 'CONTINUE');
    assert.equal(p.addSocraticPrompt, true);
    assert.equal(p.reasoningStepFilter, 'none');
  });
});
