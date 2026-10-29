/**
 * Exponential equation solver — wraps StepSolver.
 */

import { AgentContext } from '../../../../core/agentContext';
import { parseEquation, solveExponential } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../../quadratic/types';

function isSameBasePossible(input: string): boolean {
  const normalized = input.replace(/\s/g, '');
  // Already same base on both sides: 2^x=2^4
  if (/^(\d+|e)\^.+=(\1)\^.+$/i.test(normalized)) return true;

  const match = normalized.match(/^(\d+)\^([a-zA-Z]+)=(\d+)$/i);
  if (!match) return false;
  const base = Number(match[1]);
  const rhs = Number(match[3]);
  if (rhs <= 0 || base <= 1) return false;
  const exact = Math.log(rhs) / Math.log(base);
  return Math.abs(exact - Math.round(exact)) < 1e-8;
}

export function defaultExponentialSolver(context: AgentContext): PartialReasoningTrace {
  const input = context.normalizedInput || context.rawInput;
  const parsed = parseEquation(input);

  if (!parsed || parsed.problemType !== 'exponential') {
    return {
      problemType: 'exponential',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not parse exponential equation from input' },
      ],
    };
  }

  try {
    const result = solveExponential(input);
    const answer = result.answers[0];

    return {
      problemType: 'exponential',
      recognizedData: {
        problemType: 'exponential',
        variable: parsed.variable,
        sameBasePossible: isSameBasePossible(parsed.normalized),
        answer,
        answers: result.answers,
      },
      reasoningSteps: result.steps.map((s, i) => ({
        order: i + 1,
        action: 'exponential_step',
        description: `${s.title}: ${s.content.split('\n')[0]}`,
        data: { step: s.step, title: s.title },
      })),
      conclusion: { answer },
    };
  } catch {
    return {
      problemType: 'exponential',
      flags: ['solve_failed'],
      reasoningSteps: [
        { order: 1, action: 'solve', description: 'Failed to solve exponential equation' },
      ],
    };
  }
}
