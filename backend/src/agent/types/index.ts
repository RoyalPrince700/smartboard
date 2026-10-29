/**
 * Shared agent types and registration contracts.
 * Core engines depend on these interfaces — not on specific subjects.
 */

import { AgentIntent } from '../core/intentEngine';
import { ReasoningTrace } from '../schemas/reasoning.schema';
import { AgentContext } from '../core/agentContext';
import { TeachingMode } from '../core/teachingEngine';

// ─── Subject / Topic Registration ───────────────────────────────────────────

export interface SubjectRegistration {
  id: string;
  label: string;
  topics: TopicRegistration[];
  /** Optional subject-specific intent detectors (run after base detectors) */
  intentDetectors?: IntentDetector[];
}

export interface TopicRegistration {
  id: string;
  label: string;
  subtopics?: string[];
  solvers: Record<string, TopicSolver>;
  rules: RuleDefinition[];
  strategies: StrategyDefinition[];
  knowledgeTypes: string[];
  /** Detect whether input belongs to this topic */
  topicClassifier?: TopicClassifier;
}

export type TopicClassifier = (
  input: string,
  context: AgentContext
) => { matches: boolean; confidence: number };

export type TopicSolver = (
  context: AgentContext
) => Promise<Partial<ReasoningTrace>> | Partial<ReasoningTrace>;

export type IntentDetector = (
  input: string,
  context: AgentContext
) => IntentDetectionResult | null;

export interface IntentDetectionResult {
  intent: AgentIntent;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// ─── Rules & Strategies (in-code definitions; also stored in MongoDB) ─────────

export type RuleOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'matches';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: unknown;
}

export interface RuleAction {
  type: 'set' | 'append' | 'selectStrategy' | 'selectKnowledge' | 'flag';
  field: string;
  value?: unknown;
}

export interface RuleDefinition {
  ruleId: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  description: string;
}

export interface StrategyDefinition {
  strategyId: string;
  priority: number;
  conditions: RuleCondition[];
  method: string;
  fallback?: string;
  description: string;
}

// ─── Knowledge query ──────────────────────────────────────────────────────────

export type KnowledgeType =
  | 'definition'
  | 'concept'
  | 'formula'
  | 'rule'
  | 'explanation'
  | 'hint'
  | 'misconception'
  | 'teaching_note'
  | 'worked_step'
  | 'vocabulary'
  | 'pattern';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface KnowledgeQuery {
  subject: string;
  topic?: string;
  subtopic?: string;
  knowledgeType?: KnowledgeType;
  difficulty?: DifficultyLevel;
  intent?: AgentIntent;
  tags?: string[];
  limit?: number;
}

// ─── Teaching ─────────────────────────────────────────────────────────────────

export interface TeachingPresentation {
  includeReasoningSteps: boolean;
  includeCoefficients: boolean;
  includeAnswer: boolean;
  includeVerification: boolean;
  /** Which knowledge types to surface in the response */
  knowledgeTypes: KnowledgeType[];
  /** Filter reasoning trace steps: current guided step, all, or none */
  reasoningStepFilter: 'current' | 'all' | 'none';
  /** Add a Socratic question instead of direct explanation */
  addSocraticPrompt?: boolean;
  maxKnowledgeDocs: number;
}

export interface TeachingAction {
  mode: TeachingMode;
  /** Keys reference knowledge categories or reasoning fields to include in response */
  contentKeys: string[];
  /** Optional explicit step index for guided mode */
  targetStep?: number;
  presentation: TeachingPresentation;
  metadata?: Record<string, unknown>;
}
