/**
 * Seed agent knowledge collections from JSON files in knowledge/seed/.
 *
 * Usage: npm run seed:agent
 */

import path from 'path';
import fs from 'fs';
import { connectDB, disconnectDB } from '../../config/db';
import { registerAgentModels } from '../registerModels';
import {
  AgentTopic,
  AgentKnowledge,
  AgentRule,
  AgentExample,
  AgentStrategy,
} from '../schemas/knowledge.schema';
import { validateImportPackage } from '../knowledge/knowledgeValidator';

const SEED_DIR = path.join(__dirname, '..', 'knowledge', 'seed');

function readJson(filename: string): Record<string, unknown>[] {
  const filePath = path.join(SEED_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Seed file not found: ${filePath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>[];
}

async function seed(): Promise<void> {
  const topics = readJson('topics.json');
  const knowledge = readJson('knowledge.json');
  const rules = readJson('rules.json');
  const examples = readJson('examples.json');
  const strategies = readJson('strategies.json');

  const validation = validateImportPackage({ topics, knowledge, rules, examples, strategies });
  if (!validation.valid) {
    console.error('Seed validation failed:');
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Validation passed. Seeding agent collections…');

  for (const doc of topics) {
    await AgentTopic.updateOne(
      { subject: doc.subject, topic: doc.topic },
      { $set: doc },
      { upsert: true }
    );
  }
  console.log(`  agentTopics: ${topics.length} document(s) upserted`);

  for (const doc of knowledge) {
    await AgentKnowledge.updateOne(
      { subject: doc.subject, topic: doc.topic, title: doc.title, knowledgeType: doc.knowledgeType },
      { $set: doc },
      { upsert: true }
    );
  }
  console.log(`  agentKnowledge: ${knowledge.length} document(s) upserted`);

  for (const doc of rules) {
    await AgentRule.updateOne(
      { subject: doc.subject, topic: doc.topic, ruleId: doc.ruleId },
      { $set: doc },
      { upsert: true }
    );
  }
  console.log(`  agentRules: ${rules.length} document(s) upserted`);

  for (const doc of examples) {
    await AgentExample.updateOne(
      { subject: doc.subject, topic: doc.topic, exampleId: doc.exampleId },
      { $set: doc },
      { upsert: true }
    );
  }
  console.log(`  agentExamples: ${examples.length} document(s) upserted`);

  for (const doc of strategies) {
    await AgentStrategy.updateOne(
      { subject: doc.subject, topic: doc.topic, strategyId: doc.strategyId },
      { $set: doc },
      { upsert: true }
    );
  }
  console.log(`  agentStrategies: ${strategies.length} document(s) upserted`);

  console.log('Seed complete.');
}

async function main(): Promise<void> {
  try {
    await connectDB();
    await registerAgentModels();
    await seed();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

main();
