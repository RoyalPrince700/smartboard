import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildKnowledgeFilter, getIntentFallbacks } from './knowledgeQueryBuilder';

describe('knowledgeQueryBuilder', () => {
  it('builds base filter with subject and active flag', () => {
    const filter = buildKnowledgeFilter({ subject: 'math' });
    assert.deepEqual(filter, { active: true, subject: 'math' });
  });

  it('includes topic, subtopic, difficulty, and knowledgeType', () => {
    const filter = buildKnowledgeFilter({
      subject: 'math',
      topic: 'quadratic',
      subtopic: 'discriminant',
      difficulty: 'beginner',
      knowledgeType: 'definition',
    });

    assert.equal(filter.topic, 'quadratic');
    assert.equal(filter.subtopic, 'discriminant');
    assert.equal(filter.difficulty, 'beginner');
    assert.equal(filter.knowledgeType, 'definition');
  });

  it('expands intent query with fallbacks for ASK_WHY', () => {
    const filter = buildKnowledgeFilter({
      subject: 'math',
      topic: 'quadratic',
      intent: 'ASK_WHY',
    });

    assert.deepEqual(filter.intents, {
      $in: ['ASK_WHY', 'ASK_EXPLANATION', 'ASK_DEFINITION'],
    });
  });

  it('uses single intent when no fallbacks defined', () => {
    const filter = buildKnowledgeFilter({
      subject: 'math',
      intent: 'START_PROBLEM',
    });

    assert.equal(filter.intents, 'START_PROBLEM');
  });

  it('getIntentFallbacks returns primary intent first', () => {
    const fallbacks = getIntentFallbacks('ASK_WHY');
    assert.equal(fallbacks[0], 'ASK_WHY');
    assert.ok(fallbacks.includes('ASK_EXPLANATION'));
  });
});
