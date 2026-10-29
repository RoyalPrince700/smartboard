/**
 * Solves quadratics using the quadratic formula.
 */

import { formatNumber, roundRoot } from '../../shared/equationAdapter';
import { calculateDiscriminant, classifyDiscriminant } from './discriminantCalculator';
import { PartialReasoningTrace } from '../types';

export function solveByQuadraticFormula(
  a: number,
  b: number,
  c: number,
  variable = 'x'
): PartialReasoningTrace {
  const discriminant = calculateDiscriminant(a, b, c);
  const { rootType, rootCount } = classifyDiscriminant(discriminant);
  const denominator = 2 * a;

  const recognizedData: Record<string, unknown> = {
    a,
    b,
    c,
    discriminant,
    rootType,
    rootCount,
    method: 'quadratic_formula',
  };

  const steps: PartialReasoningTrace['reasoningSteps'] = [
    {
      order: 1,
      action: 'quadratic_formula',
      description: `Write the quadratic formula: ${variable} = (−b ± √Δ) / 2a`,
      data: { discriminant },
    },
    {
      order: 2,
      action: 'substitute_formula',
      description: `Substitute b = ${b}, Δ = ${discriminant}, a = ${a}: ${variable} = (${-b} ± √${discriminant}) / 2(${a})`,
      data: { numeratorStart: -b, discriminant, denominatorExpression: `2(${a})` },
    },
    {
      order: 3,
      action: 'simplify_denominator',
      description: `Simplify the denominator: 2(${a}) = ${denominator}`,
      data: { denominator },
    },
  ];

  if (discriminant < 0) {
    recognizedData.roots = [];
    steps.push({
      order: 4,
      action: 'conclude',
      description: 'Discriminant < 0: no real roots',
    });
    return { recognizedData, reasoningSteps: steps };
  }

  if (discriminant === 0) {
    const root = roundRoot(-b / (2 * a));
    recognizedData.roots = [root];
    steps.push({
      order: 4,
      action: 'calculate_roots',
      description: `Because √0 = 0, ${variable} = ${formatNumber(-b)} / ${formatNumber(denominator)} = ${formatNumber(root)} (repeated root)`,
      data: { roots: [root] },
    });
    return { recognizedData, reasoningSteps: steps };
  }

  const sqrtD = Math.sqrt(discriminant);
  const root1 = roundRoot((-b + sqrtD) / (2 * a));
  const root2 = roundRoot((-b - sqrtD) / (2 * a));
  const plusNumerator = -b + sqrtD;
  const minusNumerator = -b - sqrtD;
  recognizedData.roots = [root1, root2];

  steps.push({
    order: 4,
    action: 'simplify_square_root',
    description: `Simplify the square root: √${formatNumber(discriminant)} ≈ ${formatNumber(sqrtD)}`,
    data: { sqrtDiscriminant: sqrtD },
  });

  steps.push({
    order: 5,
    action: 'calculate_roots',
    description: `Use +: ${variable}₁ = (${formatNumber(-b)} + ${formatNumber(sqrtD)}) / ${formatNumber(denominator)} = ${formatNumber(plusNumerator)} / ${formatNumber(denominator)} = ${formatNumber(root1)}`,
    data: { root: root1 },
  });

  steps.push({
    order: 6,
    action: 'calculate_roots',
    description: `Use −: ${variable}₂ = (${formatNumber(-b)} − ${formatNumber(sqrtD)}) / ${formatNumber(denominator)} = ${formatNumber(minusNumerator)} / ${formatNumber(denominator)} = ${formatNumber(root2)}`,
    data: { roots: [root1, root2] },
  });

  return { recognizedData, reasoningSteps: steps };
}
