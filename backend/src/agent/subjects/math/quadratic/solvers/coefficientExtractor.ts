/**
 * Extracts quadratic coefficients a, b, c from normalized input.
 */

import { extractQuadraticFromInput } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../types';

export function extractCoefficients(input: string): PartialReasoningTrace | null {
  const extracted = extractQuadraticFromInput(input);
  if (!extracted) return null;

  return {
    recognizedData: {
      a: extracted.a,
      b: extracted.b,
      c: extracted.c,
      variable: extracted.variable,
      degree: 2,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'identify_coefficients',
        description: `a = ${extracted.a}, b = ${extracted.b}, c = ${extracted.c}`,
        data: { a: extracted.a, b: extracted.b, c: extracted.c },
      },
    ],
  };
}

export { extractQuadraticFromInput as extractCoefficientsRaw };
