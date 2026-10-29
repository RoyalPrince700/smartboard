/**
 * Simultaneous equation solver — wraps StepSolver.
 */

import { AgentContext } from '../../../../core/agentContext';
import { parseSimultaneousInput, solveSimultaneous } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../../quadratic/types';

export function defaultSimultaneousSolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;
  const parsed = parseSimultaneousInput(input);

  if (!parsed) {
    return {
      problemType: 'simultaneous',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not parse simultaneous equations from input' },
      ],
    };
  }

  try {
    const result = solveSimultaneous(input);

    return {
      problemType: 'simultaneous',
      recognizedData: {
        problemType: 'simultaneous',
        equationCount: parsed.equations.length,
        variableCount: 2,
        answers: result.answers,
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'simultaneous_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title },
      })),
      conclusion: { answer: result.answers.join(', ') },
    };
  } catch {
    return {
      problemType: 'simultaneous',
      flags: ['solve_failed'],
      reasoningSteps: [
        { order: 1, action: 'solve', description: 'Failed to solve simultaneous equations' },
      ],
    };
  }
}
