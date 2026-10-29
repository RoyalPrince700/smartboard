/**
 * Parses input into a quadratic equation structure.
 */

import { parseEquation, ExtractedQuadratic, extractQuadraticFromInput } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../types';

export function parseQuadraticInput(input: string): {
  parsed: ReturnType<typeof parseEquation>;
  extracted: ExtractedQuadratic | null;
} {
  const parsed = parseEquation(input);
  const extracted = extractQuadraticFromInput(input);
  return { parsed, extracted };
}

export function parseToTrace(input: string): PartialReasoningTrace | null {
  const { parsed, extracted } = parseQuadraticInput(input);
  if (!parsed || !extracted) return null;

  return {
    problemType: 'quadratic',
    recognizedData: {
      degree: 2,
      a: extracted.a,
      b: extracted.b,
      c: extracted.c,
      variable: extracted.variable,
      normalized: extracted.normalized,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'parse',
        description: `Parsed equation: ${parsed.normalized}`,
        data: { normalized: parsed.normalized },
      },
    ],
  };
}
