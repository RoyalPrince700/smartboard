import { Request, Response } from 'express';
import { educationalAgent } from '../agent/core/agent';
import { sessionManager } from '../agent/conversation/sessionManager';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { AgentMessageRequest } from '../agent/schemas/response.schema';

function mapDifficulty(level?: string): 'beginner' | 'intermediate' | 'advanced' | undefined {
  if (!level) return undefined;
  if (level === 'university' || level === 'advanced') return 'advanced';
  if (level === 'senior_secondary' || level === 'intermediate') return 'intermediate';
  return 'beginner';
}

export async function agentStatus(_req: Request, res: Response) {
  const status = educationalAgent.getStatus();
  res.json({
    success: true,
    data: {
      ...status,
      enabled: env.agentEnabled,
    },
  });
}

export async function agentMessage(req: Request, res: Response) {
  if (!env.agentEnabled) {
    throw new ApiError('Educational agent is disabled', 503, 'AGENT_DISABLED');
  }

  const body = req.body as AgentMessageRequest & { message?: string };
  const message = (body.message ?? '').trim();

  if (!message) {
    throw new ApiError('Message is required', 400, 'VALIDATION_ERROR');
  }

  const result = await educationalAgent.processMessage({
    sessionId: body.sessionId,
    userId: body.userId,
    boardId: body.boardId,
    message,
    subject: body.subject ?? 'math',
    topic: body.topic,
    difficulty: mapDifficulty(body.difficulty),
    teachingMode: body.teachingMode,
  });

  res.json({ success: true, data: result.response });
}

export async function getAgentSession(req: Request, res: Response) {
  if (!env.agentEnabled) {
    throw new ApiError('Educational agent is disabled', 503, 'AGENT_DISABLED');
  }

  const session = await sessionManager.load(req.params.sessionId);
  if (!session) {
    throw new ApiError('Session not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      subject: session.subject,
      topic: session.topic,
      currentStep: session.currentStep,
      teachingMode: session.teachingMode,
      difficulty: session.difficulty,
      hasActiveProblem: Boolean(session.currentProblem?.rawInput),
      currentProblem: session.currentProblem
        ? {
            rawInput: session.currentProblem.rawInput,
            problemType: session.currentProblem.problemType,
            coefficients: session.currentProblem.coefficients,
          }
        : undefined,
      turnCount: session.conversationHistory?.length ?? 0,
    },
  });
}

export async function resetAgentSession(req: Request, res: Response) {
  if (!env.agentEnabled) {
    throw new ApiError('Educational agent is disabled', 503, 'AGENT_DISABLED');
  }

  await sessionManager.delete(req.params.sessionId);
  res.json({ success: true, data: { deleted: true } });
}
