import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateKnowledgeDocument,
  validateTopicDocument,
  validateImportPackage,
  validateKnowledgeBatch,
} from './knowledgeValidator';

describe('knowledgeValidator', () => {
  it('accepts valid knowledge document', () => {
    const result = validateKnowledgeDocument({
      subject: 'math',
      topic: 'quadratic',
      knowledgeType: 'definition',
      title: 'Standard form',
      content: 'ax² + bx + c = 0',
      intents: ['ASK_DEFINITION'],
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects missing required fields', () => {
    const result = validateKnowledgeDocument({ subject: 'math' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('topic')));
    assert.ok(result.errors.some((e) => e.includes('title')));
  });

  it('rejects invalid knowledgeType and intent', () => {
    const result = validateKnowledgeDocument({
      subject: 'math',
      topic: 'quadratic',
      knowledgeType: 'invalid_type',
      title: 'T',
      content: 'C',
      intents: ['NOT_A_REAL_INTENT'],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('knowledgeType')));
    assert.ok(result.errors.some((e) => e.includes('intent')));
  });

  it('validates topic documents', () => {
    const result = validateTopicDocument({
      subject: 'math',
      topic: 'quadratic',
      label: 'Quadratic Equations',
    });
    assert.equal(result.valid, true);
  });

  it('validates full import package', () => {
    const result = validateImportPackage({
      topics: [{ subject: 'math', topic: 'quadratic', label: 'Quadratics' }],
      knowledge: [
        {
          subject: 'math',
          topic: 'quadratic',
          knowledgeType: 'hint',
          title: 'Hint',
          content: 'Try factorization',
        },
      ],
    });
    assert.equal(result.valid, true);
  });

  it('validateKnowledgeBatch aggregates errors', () => {
    const result = validateKnowledgeBatch([{ subject: 'math' }, { topic: 'quadratic' }]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 2);
  });
});
