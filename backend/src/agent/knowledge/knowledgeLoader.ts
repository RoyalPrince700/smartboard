/**
 * Loads educational content from MongoDB via existing Mongoose connection.
 */

import {
  AgentKnowledge,
  AgentRule,
  AgentExample,
  AgentStrategy,
  AgentTopic,
  IAgentTopic,
  IAgentRule,
  IAgentExample,
  IAgentStrategy,
} from '../schemas/knowledge.schema';
import { KnowledgeQuery } from '../types';
import { AgentIntent } from '../core/intentEngine';
import { buildKnowledgeFilter } from './knowledgeQueryBuilder';

export type KnowledgeDocument = {
  _id?: string;
  subject: string;
  topic: string;
  subtopic?: string;
  knowledgeType: string;
  difficulty: string;
  title: string;
  content: string;
  tags?: string[];
  intents?: string[];
  triggerPatterns?: string[];
  version?: number;
  [key: string]: unknown;
};

export type TopicMetadata = Pick<
  IAgentTopic,
  'subject' | 'topic' | 'label' | 'description' | 'subtopics' | 'prerequisites' | 'supportedIntents' | 'supportedMethods' | 'active'
>;

export class KnowledgeLoader {
  async load(query: KnowledgeQuery): Promise<KnowledgeDocument[]> {
    const filter = buildKnowledgeFilter(query);
    const limit = query.limit ?? 20;

    return (await AgentKnowledge.find(filter)
      .sort({ version: -1, updatedAt: -1 })
      .limit(limit)
      .lean()) as unknown as KnowledgeDocument[];
  }

  async loadByIntent(
    subject: string,
    topic: string,
    intent: AgentIntent,
    options?: { difficulty?: string; subtopic?: string; limit?: number }
  ): Promise<KnowledgeDocument[]> {
    return this.load({
      subject,
      topic,
      intent,
      difficulty: options?.difficulty as KnowledgeQuery['difficulty'],
      subtopic: options?.subtopic,
      limit: options?.limit ?? 20,
    });
  }

  async loadByType(
    subject: string,
    topic: string,
    knowledgeType: KnowledgeQuery['knowledgeType'],
    options?: { difficulty?: string; subtopic?: string; limit?: number }
  ): Promise<KnowledgeDocument[]> {
    return this.load({
      subject,
      topic,
      knowledgeType,
      difficulty: options?.difficulty as KnowledgeQuery['difficulty'],
      subtopic: options?.subtopic,
      limit: options?.limit ?? 10,
    });
  }

  async loadTopicMetadata(subject: string, topic: string): Promise<TopicMetadata | null> {
    const doc = await AgentTopic.findOne({ subject, topic, active: true }).lean();
    return doc as unknown as TopicMetadata | null;
  }

  async loadAllTopics(subject?: string): Promise<TopicMetadata[]> {
    const filter: Record<string, unknown> = { active: true };
    if (subject) filter.subject = subject;
    return (await AgentTopic.find(filter).sort({ subject: 1, topic: 1 }).lean()) as unknown as TopicMetadata[];
  }

  async loadRules(subject: string, topic: string): Promise<IAgentRule[]> {
    return (await AgentRule.find({ subject, topic, active: true })
      .sort({ priority: -1 })
      .lean()) as unknown as IAgentRule[];
  }

  async loadStrategies(subject: string, topic: string): Promise<IAgentStrategy[]> {
    return (await AgentStrategy.find({ subject, topic, active: true })
      .sort({ priority: -1 })
      .lean()) as unknown as IAgentStrategy[];
  }

  async loadExamples(
    subject: string,
    topic: string,
    options?: { difficulty?: string; method?: string; limit?: number }
  ): Promise<IAgentExample[]> {
    const filter: Record<string, unknown> = { subject, topic, active: true };
    if (options?.difficulty) filter.difficulty = options.difficulty;
    if (options?.method) filter.method = options.method;

    return (await AgentExample.find(filter)
      .sort({ difficulty: 1 })
      .limit(options?.limit ?? 10)
      .lean()) as unknown as IAgentExample[];
  }
}

export const knowledgeLoader = new KnowledgeLoader();
