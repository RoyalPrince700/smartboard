/**
 * Absolute value equation solver — wraps StepSolver.
 */

import { AgentContext } from '../../../../core/agentContext';
import { parseEquation, solveAbsoluteValue } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../../quadratic/types';

export function defaultAbsoluteValueSolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;
  const parsed = parseEquation(input);

  if (!parsed || parsed.problemType !== 'absolute_value') {
    return {
      problemType: 'absolute_value',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not parse absolute value equation from input' },
      ],
    };
  }

  try {
    const result = solveAbsoluteValue(input);

    return {
      problemType: 'absolute_value',
      recognizedData: {
        problemType: 'absolute_value',
        caseCount: 2,
        answers: result.answers,
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'absolute_value_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title },
      })),
      conclusion: { answer: result.answers.join(', ') },
    };
  } catch {
    return {
      problemType: 'absolute_value',
      flags: ['solve_failed'],
      reasoningSteps: [
        { order: 1, action: 'solve', description: 'Failed to solve absolute value equation' },
      ],
    };
  }
}
