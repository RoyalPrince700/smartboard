import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreKnowledgeDocument,
  rankKnowledgeDocuments,
  deduplicateKnowledge,
} from './knowledgeRanker';
import { KnowledgeDocument } from './knowledgeLoader';

const baseDoc = (overrides: Partial<KnowledgeDocument>): KnowledgeDocument => ({
  subject: 'math',
  topic: 'quadratic',
  knowledgeType: 'explanation',
  difficulty: 'beginner',
  title: 'Test doc',
  content: 'Content',
  ...overrides,
});

describe('knowledgeRanker', () => {
  it('scores exact intent match higher than partial', () => {
    const withIntent = baseDoc({ intents: ['ASK_WHY'], title: 'A' });
    const withoutIntent = baseDoc({ intents: ['ASK_DEFINITION'], title: 'B' });

    const scoreA = scoreKnowledgeDocument(withIntent, {
      intent: 'ASK_WHY',
      difficulty: 'beginner',
    });
    const scoreB = scoreKnowledgeDocument(withoutIntent, {
      intent: 'ASK_WHY',
      difficulty: 'beginner',
    });

    assert.ok(scoreA > scoreB);
  });

  it('boosts documents matching trigger patterns', () => {
    const withTrigger = baseDoc({
      title: 'Discriminant',
      triggerPatterns: ['discriminant'],
    });
    const plain = baseDoc({ title: 'Other' });

    const scoreTrigger = scoreKnowledgeDocument(withTrigger, {
      intent: 'ASK_EXPLANATION',
      difficulty: 'beginner',
      rawInput: "I don't understand discriminant",
    });
    const scorePlain = scoreKnowledgeDocument(plain, {
      intent: 'ASK_EXPLANATION',
      difficulty: 'beginner',
      rawInput: "I don't understand discriminant",
    });

    assert.ok(scoreTrigger > scorePlain);
  });

  it('deduplicates by title and knowledgeType keeping highest version', () => {
    const docs = [
      baseDoc({ title: 'Same', knowledgeType: 'definition', version: 1 }),
      baseDoc({ title: 'Same', knowledgeType: 'definition', version: 3 }),
      baseDoc({ title: 'Same', knowledgeType: 'hint', version: 1 }),
    ];

    const result = deduplicateKnowledge(docs);
    assert.equal(result.length, 2);
    const kept = result.find((d) => d.knowledgeType === 'definition');
    assert.equal(kept?.version, 3);
  });

  it('ranks by score descending and respects limit', () => {
    const docs = [
      baseDoc({ title: 'Low', intents: [] }),
      baseDoc({ title: 'High', intents: ['ASK_WHY'], subtopic: 'coefficients' }),
    ];

    const ranked = rankKnowledgeDocuments(
      docs,
      {
        intent: 'ASK_WHY',
        difficulty: 'beginner',
        subtopic: 'coefficients',
      },
      1
    );

    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].title, 'High');
    assert.ok(ranked[0]._score > 0);
  });
});
