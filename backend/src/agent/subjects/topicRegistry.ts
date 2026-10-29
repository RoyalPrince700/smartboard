/**
 * Topic registry — combines in-code topic capabilities with MongoDB metadata.
 */

import { subjectRegistry } from './registry';
import { knowledgeLoader, TopicMetadata } from '../knowledge/knowledgeLoader';
import { TopicRegistration, SubjectRegistration } from '../types';
import { AgentContext } from '../core/agentContext';

export interface TopicCapabilities extends TopicRegistration {
  metadata?: TopicMetadata | null;
}

export interface ResolvedTopic {
  subjectId: string;
  topicId: string;
  registration: TopicRegistration;
  metadata: TopicMetadata | null;
}

class TopicRegistry {
  /** In-code topic registration (solvers, rules, strategies) */
  getTopic(subjectId: string, topicId: string): TopicRegistration | undefined {
    return subjectRegistry.getTopic(subjectId, topicId);
  }

  listTopics(subjectId: string): TopicRegistration[] {
    return subjectRegistry.get(subjectId)?.topics ?? [];
  }

  listSubjects(): SubjectRegistration[] {
    return subjectRegistry.getAll();
  }

  hasTopic(subjectId: string, topicId: string): boolean {
    return Boolean(this.getTopic(subjectId, topicId));
  }

  /** Load MongoDB metadata for a topic */
  async getTopicMetadata(subjectId: string, topicId: string): Promise<TopicMetadata | null> {
    return knowledgeLoader.loadTopicMetadata(subjectId, topicId);
  }

  /** Merge code registration + MongoDB metadata */
  async getTopicCapabilities(subjectId: string, topicId: string): Promise<TopicCapabilities | null> {
    const registration = this.getTopic(subjectId, topicId);
    if (!registration) return null;

    const metadata = await this.getTopicMetadata(subjectId, topicId);
    return { ...registration, metadata };
  }

  /** Resolve topic from student input using classifiers across all subjects */
  resolveTopicFromInput(
    input: string,
    context: AgentContext
  ): { subjectId: string; topicId: string; confidence: number } | null {
    let best: { subjectId: string; topicId: string; confidence: number } | null = null;

    for (const subject of subjectRegistry.getAll()) {
      for (const topic of subject.topics) {
        if (!topic.topicClassifier) continue;
        const result = topic.topicClassifier(input, context);
        if (result.matches && result.confidence > (best?.confidence ?? 0)) {
          best = {
            subjectId: subject.id,
            topicId: topic.id,
            confidence: result.confidence,
          };
        }
      }
    }

    return best;
  }

  /** Full resolution: registration + DB metadata */
  async resolveTopic(
    subjectId: string,
    topicId: string
  ): Promise<ResolvedTopic | null> {
    const registration = this.getTopic(subjectId, topicId);
    if (!registration) return null;

    const metadata = await this.getTopicMetadata(subjectId, topicId);
    return { subjectId, topicId, registration, metadata };
  }

  /** List all active topics from MongoDB (optionally filtered by subject) */
  async listActiveTopicsFromDb(subject?: string): Promise<TopicMetadata[]> {
    return knowledgeLoader.loadAllTopics(subject);
  }
}

export const topicRegistry = new TopicRegistry();
