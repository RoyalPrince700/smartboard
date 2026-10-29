/**
 * TutorResponse schema — structured output contract for the frontend.
 */

import { AgentIntent } from '../core/intentEngine';
import { ResponseBlock, ResponseStatus, NextAction } from '../response/responseTypes';

export interface TutorResponse {
  sessionId: string;
  intent: AgentIntent;
  subject?: string;
  topic?: string;
  status: ResponseStatus;
  blocks: ResponseBlock[];
  nextAction: NextAction;
  /** Optional metadata for frontend state (not for display) */
  meta?: {
    currentStep?: number;
    teachingMode?: string;
    difficulty?: string;
    problemType?: string;
  };
}

export interface AgentMessageRequest {
  sessionId?: string;
  userId?: string;
  boardId?: string;
  message: string;
  /** Override session defaults */
  subject?: string;
  topic?: string;
  difficulty?: string;
  teachingMode?: string;
}

export interface AgentMessageResponse {
  success: boolean;
  response: TutorResponse;
  error?: string;
}

/** Minimal valid response for not-yet-implemented pipeline stages */
export function createPlaceholderResponse(
  sessionId: string,
  intent: AgentIntent,
  message: string
): TutorResponse {
  return {
    sessionId,
    intent,
    status: 'not_implemented',
    blocks: [
      {
        type: 'explanation',
        title: 'Agent scaffolding',
        content:
          'The educational agent architecture is in place. Full pipeline implementation is tracked in TODO.md Phase 1+. ' +
          `Your message was received: "${message.slice(0, 120)}${message.length > 120 ? '…' : ''}"`,
      },
    ],
    nextAction: 'await_input',
  };
}
