/**
 * Student intent taxonomy for the educational agent.
 */

export const AGENT_INTENTS = [
  'START_PROBLEM',
  'CONTINUE',
  'ASK_EXPLANATION',
  'ASK_WHY',
  'ASK_HOW',
  'ASK_DEFINITION',
  'REQUEST_HINT',
  'REQUEST_SIMPLER_EXPLANATION',
  'CHECK_ANSWER',
  'SUBMIT_ANSWER',
  'ASK_ALTERNATIVE_METHOD',
  'GO_BACK',
  'REPEAT',
  'REQUEST_EXAMPLE',
  'REQUEST_PRACTICE',
  'CHANGE_TOPIC',
  'UNKNOWN',
] as const;

export type AgentIntent = (typeof AGENT_INTENTS)[number];

export interface IntentResult {
  intent: AgentIntent;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** Minimum confidence to accept a detected intent (below → UNKNOWN) */
export const INTENT_CONFIDENCE_THRESHOLD = 0.5;
