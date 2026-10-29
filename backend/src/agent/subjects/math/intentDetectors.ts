/**
 * Math-specific intent detectors.
 */

import { IntentDetectionResult } from '../../types';
import { isArithmeticExpression } from './arithmetic';

const EQUATION_PATTERN = /(-?\d*\s*x\s*\^?\s*2|x\s*\^?\s*2\s*[+\-]|=\s*0)/i;

export const mathIntentDetectors: Array<
  (input: string, context: import('../../core/agentContext').AgentContext) => IntentDetectionResult | null
> = [
  /** Strong START_PROBLEM for basic numeric arithmetic (e.g. 4+2+4 =) */
  (input, context) => {
    if (context.session.currentProblem?.rawInput) return null;
    const trimmed = input.trim();
    if (!isArithmeticExpression(trimmed)) return null;
    if (/\bwhy\b/i.test(trimmed)) return null;

    return {
      intent: 'START_PROBLEM',
      confidence: 0.94,
      metadata: { detector: 'math_arithmetic_start', problemType: 'arithmetic' },
    };
  },

  /** Strong START_PROBLEM for explicit equations */
  (input, context) => {
    if (context.session.currentProblem?.rawInput) return null;
    const trimmed = input.trim();
    if (!EQUATION_PATTERN.test(trimmed)) return null;
    if (/\bwhy\b/i.test(trimmed)) return null;

    if (/\bsolve\b/i.test(trimmed) || /=/.test(trimmed)) {
      return {
        intent: 'START_PROBLEM',
        confidence: 0.91,
        metadata: { detector: 'math_equation_start' },
      };
    }
    return null;
  },

  /** Factorization alternative method */
  (input, context) => {
    if (!context.session.currentProblem?.rawInput) return null;
    if (/\b(factori(s|z)(e|ation)|factor)\b/i.test(input)) {
      return {
        intent: 'ASK_ALTERNATIVE_METHOD',
        confidence: 0.9,
        metadata: { detector: 'math_factorization_method', method: 'factorization' },
      };
    }
    return null;
  },

  /** Graph/visualize requests */
  (input) => {
    if (/\b(graph|plot|sketch)\b/i.test(input) && /y\s*=|x\s*\^?\s*2/i.test(input)) {
      return {
        intent: 'START_PROBLEM',
        confidence: 0.75,
        metadata: { detector: 'math_graph', problemType: 'graph' },
      };
    }
    return null;
  },
];
