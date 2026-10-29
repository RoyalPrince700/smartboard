/**
 * Linear equation solver — wraps existing StepSolver.
 */

import { AgentContext } from '../../../../core/agentContext';
import { parseEquation, solveLinear, analyzeLinearEquation } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../../quadratic/types';

export function defaultLinearSolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;
  const parsed = parseEquation(input);

  if (!parsed || parsed.problemType !== 'linear') {
    return {
      problemType: 'linear',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not parse linear equation from input' },
      ],
    };
  }

  try {
    const result = solveLinear(input);
    const analysis = analyzeLinearEquation(input);
    const rootMatch = result.answers[0]?.match(/x\s*=\s*(.+)/i);
    const root = rootMatch ? rootMatch[1].trim() : result.answers[0];

    return {
      problemType: 'linear',
      recognizedData: {
        degree: 1,
        variable: parsed.variable,
        answer: root,
        answers: result.answers,
        ...(analysis ?? {}),
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'linear_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title },
      })),
      conclusion: { answer: root },
    };
  } catch {
    return {
      problemType: 'linear',
      flags: ['solve_failed'],
      reasoningSteps: [
        { order: 1, action: 'solve', description: 'Failed to solve linear equation' },
      ],
    };
  }
}
