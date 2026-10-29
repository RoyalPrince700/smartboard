/**
 * Unit tests for TutorResponse validation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTutorResponse,
  validateResponseBlock,
  serializeTutorResponse,
  containsHtml,
  ResponseValidationError,
} from './responseValidator';
import { TutorResponse } from '../schemas/response.schema';

function validResponse(overrides: Partial<TutorResponse> = {}): TutorResponse {
  return {
    sessionId: 'sess-1',
    intent: 'START_PROBLEM',
    status: 'ok',
    blocks: [{ type: 'explanation', title: 'Tutor', content: 'Hello' }],
    nextAction: 'await_student_step',
    ...overrides,
  };
}

describe('responseValidator', () => {
  it('accepts valid TutorResponse JSON', () => {
    assert.doesNotThrow(() => validateTutorResponse(validResponse()));
    const json = serializeTutorResponse(validResponse());
    assert.equal(json.sessionId, 'sess-1');
    assert.ok(Array.isArray(json.blocks));
  });

  it('rejects missing sessionId', () => {
    assert.throws(
      () => validateTutorResponse(validResponse({ sessionId: '' })),
      ResponseValidationError
    );
  });

  it('rejects empty blocks array', () => {
    assert.throws(
      () => validateTutorResponse(validResponse({ blocks: [] })),
      /blocks must not be empty/
    );
  });

  it('rejects HTML in block content', () => {
    assert.equal(containsHtml('<p>hello</p>'), true);
    assert.equal(containsHtml('plain text'), false);

    assert.throws(
      () =>
        validateResponseBlock({
          type: 'explanation',
          content: '<strong>bad</strong>',
        }),
      /must not contain HTML/
    );
  });

  it('validates required fields per block type', () => {
    assert.throws(
      () => validateResponseBlock({ type: 'formula', expression: '' }),
      /formula requires expression/
    );
    assert.throws(
      () => validateResponseBlock({ type: 'question', prompt: '' }),
      /question requires prompt/
    );
    assert.throws(
      () => validateResponseBlock({ type: 'hint', content: '  ' }),
      /hint requires content/
    );
  });

  it('accepts valid verification block', () => {
    assert.doesNotThrow(() =>
      validateResponseBlock({
        type: 'verification',
        status: 'correct',
        feedback: 'Well done',
      })
    );
  });

  it('rejects invalid block type', () => {
    assert.throws(
      () =>
        validateResponseBlock({ type: 'invalid' as 'explanation', content: 'x' }),
      /invalid block type/
    );
  });
});
