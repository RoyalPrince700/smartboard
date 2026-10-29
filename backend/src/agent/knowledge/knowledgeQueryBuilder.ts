/**
 * Builds MongoDB filters for knowledge queries (pure, testable).
 */

import { KnowledgeQuery } from '../types';
import { AgentIntent } from '../core/intentEngine';

export interface MongoKnowledgeFilter {
  active: boolean;
  subject: string;
  topic?: string;
  subtopic?: string;
  knowledgeType?: string;
  difficulty?: string;
  intents?: AgentIntent | { $in: AgentIntent[] };
  tags?: { $in: string[] };
}

/** Intents that should fall back to broader content when no exact match exists */
const INTENT_FALLBACK_MAP: Partial<Record<AgentIntent, AgentIntent[]>> = {
  ASK_WHY: ['ASK_EXPLANATION', 'ASK_DEFINITION'],
  ASK_HOW: ['ASK_EXPLANATION'],
  REQUEST_SIMPLER_EXPLANATION: ['ASK_EXPLANATION', 'ASK_DEFINITION'],
  CHECK_ANSWER: ['SUBMIT_ANSWER'],
  SUBMIT_ANSWER: ['CHECK_ANSWER'],
};

export function buildKnowledgeFilter(query: KnowledgeQuery): MongoKnowledgeFilter {
  const filter: MongoKnowledgeFilter = {
    active: true,
    subject: query.subject,
  };

  if (query.topic) filter.topic = query.topic;
  if (query.subtopic) filter.subtopic = query.subtopic;
  if (query.knowledgeType) filter.knowledgeType = query.knowledgeType;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.tags?.length) filter.tags = { $in: query.tags };

  if (query.intent) {
    const fallbacks = INTENT_FALLBACK_MAP[query.intent];
    filter.intents = fallbacks?.length
      ? { $in: [query.intent, ...fallbacks] }
      : query.intent;
  }

  return filter;
}

export function getIntentFallbacks(intent: AgentIntent): AgentIntent[] {
  const fallbacks = INTENT_FALLBACK_MAP[intent] ?? [];
  return [intent, ...fallbacks];
}
