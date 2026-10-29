/**
 * In-memory conversation harness for pipeline e2e tests (no MongoDB).
 */

import { v4 as uuidv4 } from 'uuid';
import { intentEngine } from '../core/intentEngine';
import { conversationEngine } from '../core/conversationEngine';
import { reasoningEngine } from '../core/reasoningEngine';
import { teachingEngine } from '../core/teachingEngine';
import { responseBuilder } from '../response/responseBuilder';
import { TutorSessionData, createEmptySession } from '../schemas/conversation.schema';
import { TutorResponse } from '../schemas/response.schema';

export interface TurnResult {
  response: TutorResponse;
  session: TutorSessionData;
}

export interface HarnessOptions {
  subject?: string;
  topic?: string;
  difficulty?: TutorSessionData['difficulty'];
  teachingMode?: TutorSessionData['teachingMode'];
}

export class ConversationHarness {
  private session: TutorSessionData;

  constructor(options: HarnessOptions = {}) {
    const base = createEmptySession(uuidv4()) as TutorSessionData;
    this.session = {
      ...base,
      subject: options.subject ?? 'math',
      topic: options.topic ?? 'quadratic',
      difficulty: options.difficulty ?? 'beginner',
      teachingMode: options.teachingMode ?? 'GUIDED',
    };
  }

  getSession(): TutorSessionData {
    return this.session;
  }

  async send(message: string): Promise<TurnResult> {
    const hasActiveProblem = conversationEngine.hasActiveProblem(this.session);

    const intent = intentEngine.detect(message, {
      session: this.session,
      hasActiveProblem,
      subject: this.session.subject,
      topic: this.session.topic,
    });

    const context = conversationEngine.prepareContext(message, this.session, intent);
    context.loadedKnowledge = [];

    await reasoningEngine.run(context);
    context.teachingAction = teachingEngine.selectAction(context);

    const response = responseBuilder.build(context);
    const summary = response.blocks
      .map((b) => ('content' in b ? b.content : 'title' in b && b.title ? b.title : ''))
      .join(' ');

    this.session = conversationEngine.updateSession(context, summary);

    return { response, session: this.session };
  }
}

export async function runConversation(
  messages: string[],
  options?: HarnessOptions
): Promise<TurnResult[]> {
  const harness = new ConversationHarness(options);
  const results: TurnResult[] = [];
  for (const message of messages) {
    results.push(await harness.send(message));
  }
  return results;
}
