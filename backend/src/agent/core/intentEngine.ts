/**
 * Re-exports intent engine from intent module (backward compatibility).
 */

export {
  IntentEngine,
  intentEngine,
  detectIntent,
  AGENT_INTENTS,
  INTENT_CONFIDENCE_THRESHOLD,
} from '../intent/intentEngine';

export type { AgentIntent, IntentResult } from '../intent/intents';
