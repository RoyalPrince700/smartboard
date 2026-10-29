/**
 * Mutable context object passed through the agent pipeline.
 */

import { IntentResult } from './intentEngine';
import { TeachingMode } from './teachingEngine';
import { TeachingAction, DifficultyLevel } from '../types';
import { KnowledgeDocument } from '../knowledge/knowledgeLoader';
import { ReasoningTrace } from '../schemas/reasoning.schema';
import { TutorSessionData } from '../schemas/conversation.schema';

export interface AgentContext {
  /** Raw student message */
  rawInput: string;
  /** Normalized input (unicode math, whitespace) */
  normalizedInput: string;

  session: TutorSessionData;
  intent: IntentResult;

  subject?: string;
  topic?: string;
  subtopic?: string;

  loadedKnowledge: KnowledgeDocument[];
  reasoningTrace: ReasoningTrace;
  teachingAction?: TeachingAction;

  /** Resolved contextual references (e.g. "b" → 5) */
  resolvedReferences: Record<string, unknown>;

  difficulty: DifficultyLevel;
  teachingMode: TeachingMode;

  /** Pipeline stage markers for debugging */
  pipelineStage?: string;
}

export function createAgentContext(
  rawInput: string,
  session: TutorSessionData,
  intent: IntentResult
): AgentContext {
  return {
    rawInput,
    normalizedInput: normalizeInput(rawInput),
    session,
    intent,
    subject: session.subject,
    topic: session.topic,
    subtopic: session.subtopic,
    loadedKnowledge: [],
    reasoningTrace: { reasoningSteps: [], flags: [] },
    resolvedReferences: {},
    difficulty: session.difficulty ?? 'beginner',
    teachingMode: session.teachingMode ?? 'GUIDED',
  };
}

export function normalizeInput(input: string): string {
  return input
    .trim()
    .replace(/²/g, '^2')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, ' ');
}
