/**
 * Attempts to solve by factorization when integer factors are straightforward.
 */

import { roundRoot } from '../../shared/equationAdapter';
import { PartialReasoningTrace } from '../types';

export interface FactorizationResult {
  factorizable: boolean;
  factorization?: string;
  roots?: number[];
}

/** Find integer pair (p, q) where p × q = product and p + q = sum */
export function findFactorPair(product: number, sum: number): [number, number] | null {
  const absProduct = Math.abs(product);
  for (let p = 1; p <= absProduct; p++) {
    if (absProduct % p !== 0) continue;
    const q = absProduct / p;
    const pairs: [number, number][] = [
      [p, q],
      [-p, -q],
      [-p, q],
      [p, -q],
    ];
    for (const [a, b] of pairs) {
      const signProduct = product < 0 ? -1 : 1;
      const actualA = signProduct < 0 && a > 0 ? -a : a;
      const actualB = signProduct < 0 && b > 0 ? -b : b;
      if (actualA * actualB === product && actualA + actualB === sum) {
        return [actualA, actualB];
      }
    }
    if (p * q === absProduct) {
      if (product > 0 && (p + q === sum || -p - q === sum)) return p + q === sum ? [p, q] : [-p, -q];
    }
  }

  // Simple search for monic case
  for (let i = -Math.abs(sum) - 10; i <= Math.abs(sum) + 10; i++) {
    if (i === 0) continue;
    if (product % i !== 0) continue;
    const j = product / i;
    if (i + j === sum) return [i, j];
  }

  return null;
}

export function tryFactorization(a: number, b: number, c: number): FactorizationResult {
  if (a === 0) return { factorizable: false };

  if (Math.abs(a) === 1) {
    const sign = a > 0 ? 1 : -1;
    const pair = findFactorPair(sign * c, sign * b);
    if (!pair) return { factorizable: false };

    const [p, q] = pair;
    const roots = [roundRoot(-p), roundRoot(-q)].sort((x, y) => x - y);
    const fmt = (n: number) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);
    return {
      factorizable: true,
      factorization: `(x ${fmt(p)})(x ${fmt(q)})`,
      roots,
    };
  }

  return { factorizable: false };
}

export function isFactorizable(a: number, b: number, c: number): boolean {
  return tryFactorization(a, b, c).factorizable;
}

export function solveByFactorization(
  a: number,
  b: number,
  c: number,
  variable = 'x'
): PartialReasoningTrace {
  const result = tryFactorization(a, b, c);

  if (!result.factorizable || !result.roots) {
    return {
      recognizedData: { factorizable: false, method: 'factorization' },
      flags: ['factorization_not_applicable'],
      reasoningSteps: [
        {
          order: 1,
          action: 'factorization',
          description: 'Factorization is not straightforward; use quadratic formula instead',
        },
      ],
    };
  }

  return {
    recognizedData: {
      factorizable: true,
      factorization: result.factorization,
      roots: result.roots,
      method: 'factorization',
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'factorization',
        description: `Factorized: ${result.factorization} = 0`,
        data: { factorization: result.factorization },
      },
      {
        order: 2,
        action: 'calculate_roots',
        description: `Roots: ${result.roots.map((r) => `${variable} = ${r}`).join(', ')}`,
        data: { roots: result.roots },
      },
    ],
  };
}
