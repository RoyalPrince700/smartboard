/**
 * Selects knowledge documents and reasoning steps for a teaching action.
 * No calculations — filtering and ranking only.
 */

import { AgentContext } from '../core/agentContext';
import { KnowledgeDocument } from '../knowledge/knowledgeLoader';
import { ReasoningStep } from '../schemas/reasoning.schema';
import { KnowledgeType, TeachingAction } from '../types';
import { STEP_ACTION_MAP } from './modeHandlers';
import { preferredKnowledgeDifficulty } from './difficultyAdapter';

export function selectKnowledgeForTeaching(
  docs: KnowledgeDocument[],
  action: TeachingAction | undefined,
  context: AgentContext
): KnowledgeDocument[] {
  if (!action || action.presentation.maxKnowledgeDocs === 0) return [];

  const allowedTypes = new Set(action.presentation.knowledgeTypes);
  const preferredDifficulty = preferredKnowledgeDifficulty(context);
  const stepId = context.resolvedReferences.stepId as string | undefined;
  const contentKeys = new Set(action.contentKeys);

  const scored = docs
    .filter((doc) => allowedTypes.has(doc.knowledgeType as KnowledgeType))
    .map((doc) => ({
      doc,
      score: scoreKnowledgeDoc(doc, {
        preferredDifficulty,
        contentKeys,
        stepId,
        subtopic: context.subtopic ?? context.session.subtopic,
        intent: context.intent.intent,
      }),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, action.presentation.maxKnowledgeDocs).map(({ doc }) => doc);
}

function scoreKnowledgeDoc(
  doc: KnowledgeDocument,
  ctx: {
    preferredDifficulty: string;
    contentKeys: Set<string>;
    stepId?: string;
    subtopic?: string;
    intent: string;
  }
): number {
  let score = 1;

  if (doc.difficulty === ctx.preferredDifficulty) score += 3;
  if (doc.intents?.includes(ctx.intent)) score += 4;
  if (ctx.subtopic && doc.subtopic === ctx.subtopic) score += 3;
  if (ctx.stepId && doc.subtopic === ctx.stepId) score += 2;
  if (ctx.stepId && doc.tags?.includes(ctx.stepId)) score += 2;

  for (const key of ctx.contentKeys) {
    if (doc.knowledgeType === key || doc.tags?.includes(key) || doc.subtopic === key) {
      score += 2;
    }
  }

  if (doc.triggerPatterns?.length) {
    const lower = ctx.intent.toLowerCase();
    if (doc.triggerPatterns.some((p) => lower.includes(p.toLowerCase()))) score += 1;
  }

  return score;
}

export function filterReasoningSteps(
  steps: ReasoningStep[],
  action: TeachingAction | undefined,
  context: AgentContext
): ReasoningStep[] {
  const filter = action?.presentation.reasoningStepFilter ?? 'none';
  if (filter === 'none') return [];
  if (filter === 'all') {
    return steps.filter((s) => isSolverStep(s.action));
  }

  const stepId = context.resolvedReferences.stepId as string | undefined;
  if (!stepId) return steps.filter((s) => isSolverStep(s.action)).slice(0, 1);

  const allowedActions = STEP_ACTION_MAP[stepId] ?? [];
  const matched = steps.filter((s) => allowedActions.includes(s.action));
  return matched.length > 0 ? matched : steps.filter((s) => isSolverStep(s.action)).slice(0, 1);
}

function isSolverStep(action: string): boolean {
  return ![
    'normalize',
    'identify_subject',
    'identify_topic',
    'apply_rule',
    'select_strategy',
    'conclude',
  ].includes(action);
}
