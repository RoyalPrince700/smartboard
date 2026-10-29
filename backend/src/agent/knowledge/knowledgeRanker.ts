/**
 * Ranks and deduplicates knowledge documents for a given context (pure, testable).
 */

import { AgentIntent } from '../core/intentEngine';
import { DifficultyLevel } from '../types';
import { KnowledgeDocument } from './knowledgeLoader';

export interface RankContext {
  intent: AgentIntent;
  difficulty: DifficultyLevel;
  subtopic?: string;
  resolvedReferences?: Record<string, unknown>;
  rawInput?: string;
}

export interface RankedKnowledge extends KnowledgeDocument {
  _score: number;
}

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

/**
 * Score a document for relevance. Higher is better.
 */
export function scoreKnowledgeDocument(doc: KnowledgeDocument, ctx: RankContext): number {
  let score = 0;

  // Intent match (exact > fallback via loader query; boost exact here)
  if (doc.intents?.includes(ctx.intent)) {
    score += 40;
  } else if (doc.intents?.length) {
    score += 10;
  }

  // Difficulty: exact match best; adjacent levels partial credit
  if (doc.difficulty === ctx.difficulty) {
    score += 25;
  } else {
    const docIdx = DIFFICULTY_ORDER.indexOf(doc.difficulty as DifficultyLevel);
    const ctxIdx = DIFFICULTY_ORDER.indexOf(ctx.difficulty);
    if (docIdx >= 0 && ctxIdx >= 0) {
      const distance = Math.abs(docIdx - ctxIdx);
      score += Math.max(0, 15 - distance * 8);
    }
  }

  // Subtopic match
  if (ctx.subtopic && doc.subtopic === ctx.subtopic) {
    score += 20;
  }

  // Contextual concept reference
  const concept = ctx.resolvedReferences?.currentConcept as string | undefined;
  if (concept && doc.subtopic === concept) {
    score += 15;
  }
  if (concept && doc.tags?.includes(concept)) {
    score += 10;
  }

  // Trigger pattern match in student message
  if (ctx.rawInput && doc.triggerPatterns?.length) {
    const lower = ctx.rawInput.toLowerCase();
    if (doc.triggerPatterns.some((p) => lower.includes(p.toLowerCase()))) {
      score += 30;
    }
  }

  // Prefer higher version
  const version = typeof doc.version === 'number' ? doc.version : 1;
  score += Math.min(version, 5);

  return score;
}

export function rankKnowledgeDocuments(
  docs: KnowledgeDocument[],
  ctx: RankContext,
  limit = 10
): RankedKnowledge[] {
  const deduped = deduplicateKnowledge(docs);

  return deduped
    .map((doc) => ({ ...doc, _score: scoreKnowledgeDocument(doc, ctx) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

/**
 * Remove duplicates by title + knowledgeType (keep highest version).
 */
export function deduplicateKnowledge(docs: KnowledgeDocument[]): KnowledgeDocument[] {
  const byKey = new Map<string, KnowledgeDocument>();

  for (const doc of docs) {
    const key = `${doc.knowledgeType}::${doc.title}`;
    const existing = byKey.get(key);
    const docVersion = typeof doc.version === 'number' ? doc.version : 1;
    const existingVersion =
      existing && typeof existing.version === 'number' ? existing.version : 0;

    if (!existing || docVersion > existingVersion) {
      byKey.set(key, doc);
    }
  }

  return Array.from(byKey.values());
}
