/**
 * Conversation engine — session updates and contextual message resolution.
 */

import { AgentContext, createAgentContext } from './agentContext';
import { IntentResult } from './intentEngine';
import { TutorSessionData } from '../schemas/conversation.schema';
import { contextManager } from '../conversation/contextManager';
import { stateManager } from '../conversation/stateManager';
import { conversationMemory } from '../conversation/conversationMemory';

export class ConversationEngine {
  /**
   * Prepare context from session and resolve contextual references in the message.
   */
  prepareContext(
    message: string,
    session: TutorSessionData,
    intent: IntentResult
  ): AgentContext {
    const context = createAgentContext(message, session, intent);
    const resolved = contextManager.resolve(message, session, intent.intent);

    context.resolvedReferences = resolved.references;

    if (resolved.currentConcept) {
      context.session.currentConcept = resolved.currentConcept;
    }

    // Enrich context for downstream engines
    context.resolvedReferences.impliesContinuation = resolved.impliesContinuation;
    context.resolvedReferences.refersToActiveProblem = resolved.refersToActiveProblem;

    const stepInfo = stateManager.getCurrentStepInfo(session);
    if (stepInfo) {
      context.resolvedReferences.stepId = stepInfo.id;
      context.resolvedReferences.stepTitle = stepInfo.title;
    }

    return context;
  }

  /**
   * Update session after processing a turn.
   */
  updateSession(context: AgentContext, tutorSummary: string): TutorSessionData {
    const session: TutorSessionData = {
      ...context.session,
      conversationHistory: [...(context.session.conversationHistory ?? [])],
      completedSteps: [...(context.session.completedSteps ?? [])],
      currentProblem: context.session.currentProblem
        ? { ...context.session.currentProblem }
        : undefined,
    };

    conversationMemory.appendTurn(session, {
      role: 'student',
      content: context.rawInput,
      intent: context.intent.intent,
      timestamp: new Date(),
      metadata: {
        resolvedReferences: context.resolvedReferences,
      },
    });

    conversationMemory.appendTurn(session, {
      role: 'tutor',
      content: tutorSummary,
      timestamp: new Date(),
      metadata: {
        teachingMode: context.teachingAction?.mode,
        blockCount: context.loadedKnowledge.length,
      },
    });

    session.lastStudentAction = context.intent.intent;
    session.lastTutorAction = context.teachingAction?.mode;
    session.subject = context.subject ?? session.subject;
    session.topic = context.topic ?? session.topic;
    session.subtopic = context.subtopic ?? session.subtopic;
    session.difficulty = context.difficulty;
    session.teachingMode = context.teachingMode;

    stateManager.applyIntentTransition(
      session,
      context.intent.intent,
      context.reasoningTrace,
      context.normalizedInput
    );

    conversationMemory.updateSessionMetadata(session);

    return session;
  }

  /** Whether the session has an in-progress problem */
  hasActiveProblem(session: TutorSessionData): boolean {
    return Boolean(session.currentProblem?.rawInput);
  }
}

export const conversationEngine = new ConversationEngine();
