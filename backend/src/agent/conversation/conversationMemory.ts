/**
 * Conversation history management and context summaries.
 */

import { TutorSessionData, ConversationTurn } from '../schemas/conversation.schema';
import { MAX_CONVERSATION_TURNS, CONTEXT_HISTORY_WINDOW } from './sessionConfig';
import { AgentIntent } from '../core/intentEngine';

export interface ConversationSummary {
  turnCount: number;
  studentTurns: number;
  tutorTurns: number;
  lastStudentIntent?: AgentIntent;
  lastStudentMessage?: string;
  hasActiveProblem: boolean;
  currentStep: number;
  recentTopics: string[];
}

export class ConversationMemory {
  appendTurn(session: TutorSessionData, turn: ConversationTurn): void {
    session.conversationHistory = [...(session.conversationHistory ?? []), turn];
    if (session.conversationHistory.length > MAX_CONVERSATION_TURNS) {
      session.conversationHistory = session.conversationHistory.slice(-MAX_CONVERSATION_TURNS);
    }
  }

  getRecentTurns(session: TutorSessionData, count = CONTEXT_HISTORY_WINDOW): ConversationTurn[] {
    return (session.conversationHistory ?? []).slice(-count);
  }

  getLastStudentTurn(session: TutorSessionData): ConversationTurn | undefined {
    const history = session.conversationHistory ?? [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'student') return history[i];
    }
    return undefined;
  }

  summarize(session: TutorSessionData): ConversationSummary {
    const history = session.conversationHistory ?? [];
    const studentTurns = history.filter((t) => t.role === 'student');
    const lastStudent = studentTurns[studentTurns.length - 1];

    const recentTopics = [...new Set([session.topic, session.subtopic].filter(Boolean))] as string[];

    return {
      turnCount: history.length,
      studentTurns: studentTurns.length,
      tutorTurns: history.filter((t) => t.role === 'tutor').length,
      lastStudentIntent: lastStudent?.intent,
      lastStudentMessage: lastStudent?.content,
      hasActiveProblem: Boolean(session.currentProblem?.rawInput),
      currentStep: session.currentStep,
      recentTopics,
    };
  }

  /** Store summary in session metadata for quick access */
  updateSessionMetadata(session: TutorSessionData): void {
    session.metadata = {
      ...session.metadata,
      conversationSummary: this.summarize(session),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

export const conversationMemory = new ConversationMemory();
