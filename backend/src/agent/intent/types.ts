/**
 * Intent detection types.
 */

import { AgentIntent, IntentResult } from './intents';
import { TutorSessionData } from '../schemas/conversation.schema';
import { AgentContext } from '../core/agentContext';

export type IntentDetectorFn = (
  input: string,
  context: AgentContext
) => IntentResult | null;

export interface IntentDetectionContext {
  session?: TutorSessionData;
  hasActiveProblem?: boolean;
  subject?: string;
  topic?: string;
  /** Additional subject-specific detectors (merged with registry) */
  subjectDetectors?: IntentDetectorFn[];
}

export interface IntentPattern {
  intent: AgentIntent;
  priority: number;
  patterns: RegExp[];
  keywords?: string[];
  requiresActiveProblem?: boolean;
  requiresNoActiveProblem?: boolean;
  baseConfidence: number;
}

export interface SessionIntentRule {
  id: string;
  priority: number;
  match: (input: string, ctx: IntentDetectionContext) => boolean;
  resolve: (input: string, ctx: IntentDetectionContext) => IntentResult;
}
