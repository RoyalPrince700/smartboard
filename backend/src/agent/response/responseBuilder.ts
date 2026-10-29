/**
 * Builds validated TutorResponse from agent context.
 */

import { AgentContext } from '../core/agentContext';
import { TutorResponse } from '../schemas/response.schema';
import { ResponseBlock } from './responseTypes';
import { validateTutorResponse } from './responseValidator';
import { resolveResponseStatus } from './statusResolver';
import {
  assembleAnswerBlock,
  assembleCoefficientBlock,
  assembleDiagramBlock,
  assembleFallbackBlock,
  assembleGuidedStepBlock,
  assembleReasoningStepBlock,
  assembleSocraticBlock,
  assembleVerificationBlock,
  knowledgeDocToBlock,
  resolveNextAction,
} from './blockAssembler';
import { selectKnowledgeForTeaching, filterReasoningSteps } from '../teaching';

export class ResponseBuilder {
  build(context: AgentContext): TutorResponse {
    const action = context.teachingAction;
    const presentation = action?.presentation;
    const blocks: ResponseBlock[] = [];

    if (presentation?.includeCoefficients) {
      const coeffBlock = assembleCoefficientBlock(context);
      if (coeffBlock) blocks.push(coeffBlock);
    }

    if (action?.mode !== 'EXAM') {
      const diagramBlock = assembleDiagramBlock(context);
      if (diagramBlock) blocks.push(diagramBlock);
    }

    if (presentation?.addSocraticPrompt) {
      blocks.push(assembleSocraticBlock(context)!);
    }

    if (action?.mode === 'GUIDED') {
      const guidedBlock = assembleGuidedStepBlock(context);
      if (guidedBlock) blocks.push(guidedBlock);
    }

    if (presentation?.includeReasoningSteps) {
      const steps = filterReasoningSteps(
        context.reasoningTrace.reasoningSteps,
        action,
        context
      );
      for (const step of steps) {
        const block = assembleReasoningStepBlock(step);
        if (block) blocks.push(block);
      }
    }

    if (presentation?.includeAnswer) {
      const answerBlock = assembleAnswerBlock(context);
      if (answerBlock) blocks.push(answerBlock);
    }

    if (presentation?.includeVerification) {
      const verificationBlock = assembleVerificationBlock(context);
      if (verificationBlock) blocks.push(verificationBlock);
    }

    const knowledgeDocs = selectKnowledgeForTeaching(
      context.loadedKnowledge,
      action,
      context
    );
    for (const doc of knowledgeDocs) {
      blocks.push(...knowledgeDocToBlock(doc, context));
    }

    if (blocks.length === 0) {
      blocks.push(assembleFallbackBlock(context));
    }

    const response: TutorResponse = {
      sessionId: context.session.sessionId,
      intent: context.intent.intent,
      subject: context.subject,
      topic: context.topic,
      status: resolveResponseStatus(context),
      blocks,
      nextAction: resolveNextAction(context),
      meta: {
        currentStep: context.session.currentStep,
        teachingMode: action?.mode,
        difficulty: context.difficulty,
        problemType: context.reasoningTrace.problemType,
      },
    };

    validateTutorResponse(response);
    return response;
  }
}

export const responseBuilder = new ResponseBuilder();
