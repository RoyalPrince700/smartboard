/**
 * Teaching modes and pedagogical action selection.
 * Answers: "How should I teach this?" — NOT "What is mathematically true?"
 */

import { AgentContext } from './agentContext';
import { AgentIntent } from './intentEngine';
import { TeachingAction } from '../types';
import {
  getPresentationForMode,
  adaptPresentationForDifficulty,
} from '../teaching';

export const TEACHING_MODES = [
  'DIRECT',
  'GUIDED',
  'SOCRATIC',
  'HINT',
  'EXAM',
  'PRACTICE',
] as const;

export type TeachingMode = (typeof TEACHING_MODES)[number];

const INTENT_TO_MODE: Partial<Record<AgentIntent, TeachingMode>> = {
  START_PROBLEM: 'GUIDED',
  CONTINUE: 'GUIDED',
  ASK_EXPLANATION: 'DIRECT',
  ASK_WHY: 'DIRECT',
  ASK_HOW: 'GUIDED',
  ASK_DEFINITION: 'DIRECT',
  REQUEST_HINT: 'HINT',
  REQUEST_SIMPLER_EXPLANATION: 'DIRECT',
  CHECK_ANSWER: 'EXAM',
  SUBMIT_ANSWER: 'EXAM',
  ASK_ALTERNATIVE_METHOD: 'DIRECT',
  REQUEST_EXAMPLE: 'DIRECT',
  REQUEST_PRACTICE: 'PRACTICE',
};

export class TeachingEngine {
  /**
   * Select pedagogical action from intent, session, and reasoning output.
   * Never performs calculations — uses reasoning trace fields only.
   */
  selectAction(context: AgentContext): TeachingAction {
    const mode = this.resolveMode(context);
    const contentKeys = this.resolveContentKeys(context.intent.intent, context);
    const presentation = adaptPresentationForDifficulty(
      getPresentationForMode(mode, context.intent.intent),
      context
    );

    return {
      mode,
      contentKeys,
      targetStep: context.session.currentStep,
      presentation,
      metadata: {
        intent: context.intent.intent,
        difficulty: context.difficulty,
        stepId: context.resolvedReferences.stepId,
        stepTitle: context.resolvedReferences.stepTitle,
        problemType: context.reasoningTrace.problemType,
        selectedMethod: context.reasoningTrace.selectedMethod,
      },
    };
  }

  private resolveMode(context: AgentContext): TeachingMode {
    // Smartboard solve requests use DIRECT mode to show the full worked answer.
    if (
      context.teachingMode === 'DIRECT' &&
      (context.intent.intent === 'START_PROBLEM' ||
        context.reasoningTrace.problemType === 'arithmetic')
    ) {
      return 'DIRECT';
    }

    const intentMode = INTENT_TO_MODE[context.intent.intent];
    if (intentMode) return intentMode;

    return context.teachingMode ?? 'GUIDED';
  }

  private resolveContentKeys(intent: AgentIntent, context: AgentContext): string[] {
    const stepId = context.resolvedReferences.stepId as string | undefined;

    switch (intent) {
      case 'ASK_WHY':
      case 'ASK_DEFINITION':
        return stepId ? ['definition', 'explanation', stepId] : ['definition', 'explanation'];
      case 'REQUEST_HINT':
        return stepId ? ['hint', stepId] : ['hint'];
      case 'REQUEST_SIMPLER_EXPLANATION':
        return ['explanation', 'definition'];
      case 'REQUEST_EXAMPLE':
        return ['example', 'worked_step'];
      case 'REQUEST_PRACTICE':
        return ['practice', 'worked_step'];
      case 'START_PROBLEM':
      case 'CONTINUE':
        return stepId
          ? ['reasoning_step', 'guided_prompt', stepId]
          : ['reasoning_step', 'guided_prompt'];
      case 'SUBMIT_ANSWER':
      case 'CHECK_ANSWER':
        return ['verification'];
      case 'ASK_ALTERNATIVE_METHOD':
        if (context.topic === 'geometry' || context.reasoningTrace.problemType === 'geometry') {
          return ['area', 'perimeter', 'pythagoras', 'hint'];
        }
        return ['factorization', 'quadratic_formula', 'hint'];
      default:
        return ['explanation'];
    }
  }
}

export const teachingEngine = new TeachingEngine();
