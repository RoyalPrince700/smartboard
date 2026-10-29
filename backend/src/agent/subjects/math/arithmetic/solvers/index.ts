/**
 * Arithmetic expression solver — wraps StepSolver.
 */

import { AgentContext } from '../../../../core/agentContext';
import { evaluateExpression } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../../quadratic/types';

export function defaultArithmeticSolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;

  try {
    const result = evaluateExpression(input);
    const answer = result.answers[0];

    return {
      problemType: 'arithmetic',
      recognizedData: {
        problemType: 'arithmetic',
        answer,
        answers: result.answers,
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'arithmetic_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title },
      })),
      conclusion: { answer },
    };
  } catch {
    return {
      problemType: 'arithmetic',
      flags: ['solve_failed'],
      reasoningSteps: [
        { order: 1, action: 'solve', description: 'Failed to evaluate arithmetic expression' },
      ],
    };
  }
}
