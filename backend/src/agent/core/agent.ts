/**
 * Agent orchestrator — public entry point for the educational agent.
 */

import { v4 as uuidv4 } from 'uuid';
import { intentEngine } from './intentEngine';
import { conversationEngine } from './conversationEngine';
import { reasoningEngine } from './reasoningEngine';
import { teachingEngine } from './teachingEngine';
import { responseBuilder } from './responseBuilder';
import { knowledgeResolver } from '../knowledge/knowledgeResolver';
import { sessionManager } from '../conversation/sessionManager';
import { subjectRegistry } from '../subjects/registry';
import {
  AgentMessageRequest,
  AgentMessageResponse,
  TutorResponse,
  createPlaceholderResponse,
} from '../schemas/response.schema';
import { TutorSessionData } from '../schemas/conversation.schema';

export class EducationalAgent {
  /**
   * Process a student message and return a structured tutor response.
   * This is the main API consumed by routes/controllers (Phase 9).
   */
  async processMessage(request: AgentMessageRequest): Promise<AgentMessageResponse> {
    const sessionId = request.sessionId ?? uuidv4();

    let session: TutorSessionData = await sessionManager.loadOrCreate(sessionId, {
      userId: request.userId,
      boardId: request.boardId,
      subject: request.subject,
      topic: request.topic,
      difficulty: request.difficulty as TutorSessionData['difficulty'],
      teachingMode: request.teachingMode as TutorSessionData['teachingMode'],
    });

    const hasActiveProblem = conversationEngine.hasActiveProblem(session);

    const intent = intentEngine.detect(request.message, {
      session,
      hasActiveProblem,
      subject: session.subject,
      topic: session.topic,
    });

    const context = conversationEngine.prepareContext(request.message, session, intent);

    await knowledgeResolver.loadIntoContext(context);

    await reasoningEngine.run(context);

    context.teachingAction = teachingEngine.selectAction(context);

    const response: TutorResponse = responseBuilder.build(context);

    const tutorSummary = response.blocks.map((b) => ('content' in b ? b.content : b.title)).join(' ');
    const updatedSession = conversationEngine.updateSession(context, tutorSummary);
    await sessionManager.save(updatedSession);

    return { success: true, response: { ...response, sessionId } };
  }

  /** Health check — confirms registry and module wiring */
  getStatus(): { ready: boolean; subjects: string[]; phase: string } {
    return {
      ready: true,
      subjects: subjectRegistry.getAll().map((s) => s.id),
      phase: '10-testing',
    };
  }
}

export const educationalAgent = new EducationalAgent();

// Re-export for consumers that need placeholder during incremental rollout
export { createPlaceholderResponse };
