/**
 * Probability solver — wraps ProbabilitySolver service.
 */

import { AgentContext } from '../../../../core/agentContext';
import { solveProbability, looksLikeProbability } from '../../../../../services/math/ProbabilitySolver';
import { PartialReasoningTrace } from '../../quadratic/types';

export function defaultProbabilitySolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;

  if (!looksLikeProbability(input)) {
    return {
      problemType: 'probability',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not identify a probability question in the input' },
      ],
    };
  }

  try {
    const result = solveProbability(input);
    const answer = result.answers[0];

    return {
      problemType: 'probability',
      recognizedData: {
        problemType: 'probability',
        probabilityKind: result.kind,
        answer,
        answers: result.answers,
        fraction: result.fraction,
        decimal: result.decimal,
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'probability_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title, latex: s.latex },
      })),
      conclusion: { answer },
    };
  } catch {
    return {
      problemType: 'probability',
      flags: ['solve_failed'],
      reasoningSteps: [
        {
          order: 1,
          action: 'solve',
          description:
            'Failed to solve probability question — try stating favorable and total outcomes, or use P(A)=... for complement/AND/OR rules',
        },
      ],
    };
  }
}
