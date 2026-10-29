/**
 * Unit tests for response builder — one suite per teaching mode.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { responseBuilder } from './responseBuilder';
import { teachingEngine } from '../core/teachingEngine';
import { createAgentContext } from '../core/agentContext';
import { TutorSessionData } from '../schemas/conversation.schema';
import { KnowledgeDocument } from '../knowledge/knowledgeLoader';
import { serializeTutorResponse } from './responseValidator';
import { TEACHING_MODES } from '../core/teachingEngine';

const mockKnowledge: KnowledgeDocument[] = [
  {
    subject: 'math',
    topic: 'quadratic',
    knowledgeType: 'definition',
    difficulty: 'beginner',
    title: 'Coefficient b',
    content: 'In your equation, b = {{b}}.',
    subtopic: 'coefficients',
    intents: ['ASK_WHY'],
  },
  {
    subject: 'math',
    topic: 'quadratic',
    knowledgeType: 'hint',
    difficulty: 'beginner',
    title: 'Discriminant hint',
    content: 'Compute b² − 4ac with a={{a}}, b={{b}}, c={{c}}.',
    subtopic: 'discriminant',
    tags: ['discriminant'],
    intents: ['REQUEST_HINT'],
  },
  {
    subject: 'math',
    topic: 'quadratic',
    knowledgeType: 'formula',
    difficulty: 'intermediate',
    title: 'Discriminant formula',
    content: 'Δ = b² − 4ac',
    contentBlocks: [
      { type: 'formula', expression: 'b^2 - 4ac', latex: 'b^2 - 4ac' },
    ],
    subtopic: 'discriminant',
    intents: ['ASK_DEFINITION'],
  },
];

function makeBaseContext(
  intent: Parameters<typeof createAgentContext>[2]['intent'],
  teachingMode: (typeof TEACHING_MODES)[number] = 'GUIDED'
) {
  const session = {
    sessionId: 'resp-test',
    currentStep: 1,
    completedSteps: [],
    teachingMode,
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    subject: 'math',
    topic: 'quadratic',
    currentProblem: {
      rawInput: '2x^2 + 5x - 3 = 0',
      coefficients: { a: 2, b: 5, c: -3 },
      intermediateResults: { discriminant: 49 },
    },
  } as TutorSessionData;

  const context = createAgentContext('2x^2 + 5x - 3 = 0', session, {
    intent,
    confidence: 0.9,
  });

  context.reasoningTrace = {
    reasoningSteps: [
      { order: 1, action: 'parse', description: 'Parsed equation' },
      {
        order: 2,
        action: 'calculate_discriminant',
        description: 'Discriminant = 49',
        data: { expression: '5^2 - 4(2)(-3)' },
      },
      { order: 3, action: 'calculate_roots', description: 'x = 0.5 or x = -3' },
    ],
    recognizedData: { a: 2, b: 5, c: -3, discriminant: 49, roots: [0.5, -3] },
    problemType: 'quadratic',
    conclusion: { answer: [0.5, -3], answerDisplay: 'x = 0.5 or x = -3' },
  };
  context.resolvedReferences = {
    stepId: 'discriminant',
    stepTitle: 'Calculate the discriminant',
  };
  context.loadedKnowledge = mockKnowledge;
  context.subject = 'math';
  context.topic = 'quadratic';

  context.teachingAction = teachingEngine.selectAction(context);
  return context;
}

function buildForIntent(
  intent: Parameters<typeof createAgentContext>[2]['intent'],
  teachingMode?: (typeof TEACHING_MODES)[number]
) {
  const context = makeBaseContext(intent, teachingMode);
  return responseBuilder.build(context);
}

describe('responseBuilder — per teaching mode', () => {
  for (const mode of TEACHING_MODES) {
    it(`${mode} produces valid TutorResponse JSON`, () => {
      const intentMap: Record<(typeof TEACHING_MODES)[number], Parameters<typeof createAgentContext>[2]['intent']> = {
        DIRECT: 'ASK_EXPLANATION',
        GUIDED: 'CONTINUE',
        SOCRATIC: 'CONTINUE',
        HINT: 'REQUEST_HINT',
        EXAM: 'SUBMIT_ANSWER',
        PRACTICE: 'REQUEST_PRACTICE',
      };

      const context = makeBaseContext(intentMap[mode], mode);
      if (mode === 'EXAM') {
        context.reasoningTrace.verification = {
          status: 'correct',
          feedback: 'Correct!',
        };
      }
      context.teachingAction = teachingEngine.selectAction(context);

      const response = responseBuilder.build(context);
      const json = serializeTutorResponse(response);

      assert.equal(response.meta?.teachingMode, context.teachingAction.mode);
      assert.ok(json.blocks);
      assert.ok((json.blocks as unknown[]).length > 0);
      for (const block of json.blocks as { type: string }[]) {
        assert.ok(block.type);
      }
    });
  }
});

describe('responseBuilder — GUIDED mode', () => {
  it('includes step question without answer', () => {
    const response = buildForIntent('CONTINUE', 'GUIDED');
    assert.ok(response.blocks.some((b) => b.type === 'question'));
    assert.ok(!response.blocks.some((b) => b.type === 'answer'));
    assert.equal(response.nextAction, 'await_student_step');
  });
});

describe('responseBuilder — DIRECT mode', () => {
  it('includes answer and reasoning blocks', () => {
    const response = buildForIntent('ASK_EXPLANATION', 'DIRECT');
    assert.ok(response.blocks.some((b) => b.type === 'answer'));
    assert.equal(response.status, 'ok');
  });
});

describe('responseBuilder — HINT mode', () => {
  it('includes hint with resolved placeholders', () => {
    const response = buildForIntent('REQUEST_HINT', 'HINT');
    const hint = response.blocks.find((b) => b.type === 'hint');
    assert.ok(hint);
    assert.ok(hint && 'content' in hint && hint.content.includes('a=2'));
    assert.ok(!response.blocks.some((b) => b.type === 'answer'));
  });
});

describe('responseBuilder — EXAM mode', () => {
  it('shows verification only', () => {
    const context = makeBaseContext('SUBMIT_ANSWER', 'EXAM');
    context.reasoningTrace.verification = {
      status: 'correct',
      feedback: 'Correct!',
      expected: 'x = 0.5 or x = -3',
      received: 'x = 0.5',
    };
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.ok(response.blocks.some((b) => b.type === 'verification'));
    assert.ok(!response.blocks.some((b) => b.type === 'hint'));
    assert.ok(!response.blocks.some((b) => b.title === 'Coefficients'));
    assert.equal(response.nextAction, 'await_verification');
  });
});

describe('responseBuilder — SOCRATIC mode', () => {
  it('includes Socratic question prompt', () => {
    const context = makeBaseContext('UNKNOWN', 'SOCRATIC');
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    assert.equal(context.teachingAction.mode, 'SOCRATIC');
    assert.ok(response.blocks.some((b) => b.type === 'question'));
    assert.ok(!response.blocks.some((b) => b.type === 'calculation'));
  });
});

describe('responseBuilder — PRACTICE mode', () => {
  it('does not reveal full solution', () => {
    const response = buildForIntent('REQUEST_PRACTICE', 'PRACTICE');
    assert.ok(!response.blocks.some((b) => b.type === 'answer'));
    assert.equal(response.nextAction, 'await_problem');
  });
});

describe('responseBuilder — placeholder resolution', () => {
  it('resolves {{b}} in knowledge content', () => {
    const context = makeBaseContext('ASK_WHY', 'DIRECT');
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);

    const explanation = response.blocks.find(
      (b) => b.type === 'explanation' && b.title === 'Coefficient b'
    );
    assert.ok(explanation && 'content' in explanation && explanation.content);
    assert.ok(explanation!.content!.includes('b = 5'));
    assert.ok(!explanation!.content!.includes('{{b}}'));
  });
});

describe('responseBuilder — error status', () => {
  it('returns error status when solver failed', () => {
    const context = makeBaseContext('START_PROBLEM');
    context.reasoningTrace.flags = ['parse_failed'];
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);
    assert.equal(response.status, 'error');
  });

  it('returns unsupported when subject missing', () => {
    const context = makeBaseContext('START_PROBLEM');
    context.reasoningTrace.flags = ['missing_subject_or_topic'];
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);
    assert.equal(response.status, 'unsupported');
  });
});

describe('responseBuilder — contentBlocks', () => {
  it('maps formula contentBlocks to formula block type', () => {
    const context = makeBaseContext('ASK_EXPLANATION', 'DIRECT');
    context.teachingAction = teachingEngine.selectAction(context);
    const response = responseBuilder.build(context);
    assert.ok(response.blocks.some((b) => b.type === 'formula'));
  });
});
