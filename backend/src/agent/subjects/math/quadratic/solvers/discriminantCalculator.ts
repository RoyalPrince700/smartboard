/**
 * Calculates the discriminant Δ = b² − 4ac.
 */

import { PartialReasoningTrace } from '../types';

export function calculateDiscriminant(a: number, b: number, c: number): number {
  return b * b - 4 * a * c;
}

export function discriminantStep(a: number, b: number, c: number): PartialReasoningTrace {
  const discriminant = calculateDiscriminant(a, b, c);
  const bSquared = b * b;
  const fourAC = 4 * a * c;

  return {
    recognizedData: { discriminant },
    reasoningSteps: [
      {
        order: 1,
        action: 'calculate_discriminant',
        description: 'Write the discriminant formula: Δ = b² − 4ac',
        data: {
          expression: 'b^2 - 4ac',
        },
      },
      {
        order: 2,
        action: 'substitute_discriminant',
        description: `Substitute a = ${a}, b = ${b}, c = ${c}: Δ = (${b})² − 4(${a})(${c})`,
        data: {
          expression: `${b}^2 - 4(${a})(${c})`,
        },
      },
      {
        order: 3,
        action: 'square_b',
        description: `Square b: (${b})² = ${bSquared}`,
        data: {
          value: bSquared,
        },
      },
      {
        order: 4,
        action: 'multiply_4ac',
        description: `Multiply 4ac: 4(${a})(${c}) = ${fourAC}`,
        data: {
          value: fourAC,
        },
      },
      {
        order: 5,
        action: 'calculate_discriminant',
        description:
          fourAC < 0
            ? `Finish: Δ = ${bSquared} − (${fourAC}) = ${bSquared} + ${Math.abs(fourAC)} = ${discriminant}`
            : `Finish: Δ = ${bSquared} − ${fourAC} = ${discriminant}`,
        data: {
          value: discriminant,
        },
      },
    ],
  };
}

export function classifyDiscriminant(discriminant: number): {
  rootType: string;
  rootCount: number;
} {
  if (discriminant > 0) return { rootType: 'real_distinct', rootCount: 2 };
  if (discriminant === 0) return { rootType: 'real_repeated', rootCount: 1 };
  return { rootType: 'complex', rootCount: 0 };
}
