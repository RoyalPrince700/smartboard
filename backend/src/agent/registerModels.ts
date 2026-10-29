/**
 * Registers agent Mongoose models and ensures MongoDB indexes.
 * Import this module once after connectDB() — uses the existing connection.
 */

import {
  AgentKnowledge,
  AgentRule,
  AgentExample,
  AgentStrategy,
  AgentTopic,
} from './schemas/knowledge.schema';
import { TutorSession } from './schemas/conversation.schema';

const AGENT_MODELS = [
  AgentKnowledge,
  AgentRule,
  AgentExample,
  AgentStrategy,
  AgentTopic,
  TutorSession,
];

/** Side-effect import: models register on first import of this module */
export function importAgentSchemas(): void {
  // Models are constructed at import time; this export documents the dependency chain.
  void AGENT_MODELS;
}

/**
 * Initialise models and sync indexes. Call after connectDB().
 */
export async function registerAgentModels(): Promise<void> {
  importAgentSchemas();

  await Promise.all(AGENT_MODELS.map((m) => m.init()));

  await Promise.all(AGENT_MODELS.map((m) => m.syncIndexes()));

  console.log('Agent models registered and indexes synced');
}
