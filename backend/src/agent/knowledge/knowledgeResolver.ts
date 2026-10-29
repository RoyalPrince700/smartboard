/**
 * Resolves and ranks knowledge documents for the current agent context.
 */

import { AgentContext } from '../core/agentContext';
import { knowledgeLoader, KnowledgeDocument } from './knowledgeLoader';
import { rankKnowledgeDocuments } from './knowledgeRanker';
import { topicRegistry } from '../subjects/topicRegistry';

export interface ResolvedKnowledge {
  documents: KnowledgeDocument[];
  subtopic?: string;
  topicMetadata?: Awaited<ReturnType<typeof knowledgeLoader.loadTopicMetadata>>;
}

export class KnowledgeResolver {
  /**
   * Load, rank, and attach relevant knowledge to the agent context.
   */
  async loadIntoContext(context: AgentContext): Promise<KnowledgeDocument[]> {
    const resolved = await this.resolve(context);
    context.loadedKnowledge = resolved.documents;
    if (resolved.subtopic) context.subtopic = resolved.subtopic;
    return resolved.documents;
  }

  async resolve(context: AgentContext): Promise<ResolvedKnowledge> {
    const subject = context.subject ?? context.session.subject;
    const topic = context.topic ?? context.session.topic;

    if (!subject || !topic) {
      return { documents: [] };
    }

    context.subject = subject;
    context.topic = topic;

    const subtopic = this.inferSubtopic(context);
    const topicMetadata = await knowledgeLoader.loadTopicMetadata(subject, topic);

    // Primary query: intent + difficulty + optional subtopic
    let docs = await knowledgeLoader.loadByIntent(subject, topic, context.intent.intent, {
      difficulty: context.difficulty,
      subtopic,
      limit: 30,
    });

    // Broader fallback if intent-specific query returned nothing
    if (docs.length === 0) {
      docs = await knowledgeLoader.load({
        subject,
        topic,
        subtopic,
        difficulty: context.difficulty,
        limit: 20,
      });
    }

    const ranked = rankKnowledgeDocuments(
      docs,
      {
        intent: context.intent.intent,
        difficulty: context.difficulty,
        subtopic,
        resolvedReferences: context.resolvedReferences,
        rawInput: context.rawInput,
      },
      10
    );

    // Strip internal score before returning
    const documents = ranked.map(({ _score, ...doc }) => doc);

    return { documents, subtopic, topicMetadata };
  }

  /**
   * Infer subtopic from context references, session, or topic registry.
   */
  private inferSubtopic(context: AgentContext): string | undefined {
    if (context.subtopic) return context.subtopic;
    if (context.session.subtopic) return context.session.subtopic;

    const concept = context.resolvedReferences?.currentConcept as string | undefined;
    if (concept) return concept;

    const subject = context.subject ?? context.session.subject;
    const topic = context.topic ?? context.session.topic;
    if (subject && topic) {
      const reg = topicRegistry.getTopic(subject, topic);
      if (reg?.subtopics?.length) {
        const lower = context.rawInput.toLowerCase();
        const matched = reg.subtopics.find((s) => lower.includes(s.replace(/_/g, ' ')) || lower.includes(s));
        if (matched) return matched;
      }
    }

    return undefined;
  }
}

export const knowledgeResolver = new KnowledgeResolver();
