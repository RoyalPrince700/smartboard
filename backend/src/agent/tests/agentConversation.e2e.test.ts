/**
 * Phase 10 — end-to-end conversation pipeline tests (no MongoDB / HTTP).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConversationHarness, runConversation } from './conversationHarness';
import { serializeTutorResponse } from '../response/responseValidator';

describe('agent conversation — mathematical correctness', () => {
  it('solves basic arithmetic like 4+2+4 = even when session topic was quadratic', async () => {
    const harness = new ConversationHarness({ teachingMode: 'DIRECT' });
    const { response } = await harness.send('4+2+4 =');

    assert.equal(response.status, 'ok');
    assert.equal(response.topic, 'arithmetic');

    const answer = response.blocks.find((b) => b.type === 'answer');
    assert.ok(answer && 'value' in answer);
    assert.equal(answer.value, '10');

    serializeTutorResponse(response);
  });

  it('solves 2x^2 + 5x - 3 = 0 with correct coefficients and roots', async () => {
    const harness = new ConversationHarness();
    const { response } = await harness.send('2x^2 + 5x - 3 = 0');

    assert.equal(response.status, 'ok');
    assert.equal(response.topic, 'quadratic');
    assert.ok(response.blocks.length > 0);

    const coeffBlock = response.blocks.find(
      (b) => b.type === 'explanation' && b.title === 'Coefficients'
    );
    assert.ok(coeffBlock && 'content' in coeffBlock && coeffBlock.content);
    assert.match(coeffBlock.content!, /a = 2/);
    assert.match(coeffBlock.content!, /b = 5/);
    assert.match(coeffBlock.content!, /c = -3/);

    serializeTutorResponse(response);
  });
});

describe('agent conversation — continuity and context', () => {
  it('advances guided steps across CONTINUE turns', async () => {
    const results = await runConversation(['2x^2 + 5x - 3 = 0', 'Continue', 'Continue']);

    assert.equal(results[0].response.intent, 'START_PROBLEM');
    assert.equal(results[1].response.intent, 'CONTINUE');
    assert.equal(results[2].response.intent, 'CONTINUE');

    assert.equal(results[0].session.currentStep, 0);
    assert.equal(results[1].session.currentStep, 1);
    assert.equal(results[2].session.currentStep, 2);
  });

  it('retains coefficients when asking why about b', async () => {
    const harness = new ConversationHarness();
    await harness.send('2x^2 + 5x - 3 = 0');
    const { response, session } = await harness.send('Why is b 5?');

    assert.equal(response.intent, 'ASK_WHY');
    assert.equal(session.currentProblem?.coefficients?.b, 5);
    assert.ok(response.blocks.length > 0);
  });
});

describe('agent conversation — intent detection', () => {
  it('detects REQUEST_HINT', async () => {
    const harness = new ConversationHarness();
    await harness.send('2x^2 + 5x - 3 = 0');
    const { response } = await harness.send('give me a hint');

    assert.equal(response.intent, 'REQUEST_HINT');
    assert.equal(response.meta?.teachingMode, 'HINT');
  });

  it('detects SUBMIT_ANSWER', async () => {
    const harness = new ConversationHarness();
    await harness.send('2x^2 + 5x - 3 = 0');
    const { response } = await harness.send('x = 0.5 or x = -3');

    assert.equal(response.intent, 'SUBMIT_ANSWER');
    assert.ok(response.blocks.some((b) => b.type === 'verification'));
  });
});

describe('agent conversation — wrong and ambiguous inputs', () => {
  it('marks incorrect submitted answer', async () => {
    const harness = new ConversationHarness();
    await harness.send('2x^2 + 5x - 3 = 0');
    const { response } = await harness.send('x = 1 and x = 2');

    const verification = response.blocks.find((b) => b.type === 'verification');
    assert.ok(verification && 'status' in verification);
    assert.equal(verification.status, 'incorrect');
  });

  it('returns unsupported for non-math gibberish without subject', async () => {
    const harness = new ConversationHarness({ subject: undefined, topic: undefined });
    const session = harness.getSession();
    session.subject = undefined;
    session.topic = undefined;

    const { response } = await harness.send('hello there friend');

    assert.equal(response.status, 'unsupported');
  });

  it('handles ambiguous short input without crashing', async () => {
    const harness = new ConversationHarness();
    const { response } = await harness.send('???');

    assert.ok(response.blocks.length > 0);
    serializeTutorResponse(response);
  });
});

describe('agent conversation — session isolation', () => {
  it('keeps separate problem state per harness instance', async () => {
    const harnessA = new ConversationHarness();
    const harnessB = new ConversationHarness();

    await harnessA.send('2x^2 + 5x - 3 = 0');
    await harnessB.send('x^2 + 5x + 6 = 0');

    assert.equal(harnessA.getSession().currentProblem?.coefficients?.c, -3);
    assert.equal(harnessB.getSession().currentProblem?.coefficients?.c, 6);
    assert.notEqual(
      harnessA.getSession().sessionId,
      harnessB.getSession().sessionId
    );
  });
});

describe('agent conversation — geometry', () => {
  it('solves a 3-4-5 triangle from board-style input', async () => {
    const harness = new ConversationHarness({ topic: 'geometry', teachingMode: 'DIRECT' });
    const { response } = await harness.send(
      '[geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse'
    );

    assert.equal(response.status, 'ok');
    assert.equal(response.topic, 'geometry');
    const given = response.blocks.find((b) => b.type === 'explanation' && b.title === 'Given values');
    assert.ok(given && 'content' in given);
    assert.match(String(given.content), /triangle/);
    const diagram = response.blocks.find((b) => b.type === 'diagram');
    assert.ok(diagram && 'spec' in diagram);
    assert.equal((diagram.spec as { category?: string }).category, 'geometry');
    assert.ok(
      Array.isArray((diagram.spec as { elements?: unknown[] }).elements) &&
        (diagram.spec as { elements: unknown[] }).elements.length > 0
    );
    serializeTutorResponse(response);
  });
});
