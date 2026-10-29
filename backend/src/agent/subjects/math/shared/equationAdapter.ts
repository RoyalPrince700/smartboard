/**
 * Adapter to existing backend math services — single import point for agent solvers.
 */

export {
  parseEquation,
  parseQuadraticCoeffs,
  parseLinearCoeffs,
  moveToStandardForm,
  normalizeMathInput,
  formatNumber,
  parseSimultaneousInput,
  type ParsedEquation,
  type QuadraticCoeffs,
  type ParsedSimultaneous,
} from '../../../../services/math/EquationParser';

export {
  solveQuadratic,
  solveLinear,
  solveExponential,
  solveAbsoluteValue,
  solveSimultaneous,
  evaluateExpression,
} from '../../../../services/math/StepSolver';

export { solveProbability, looksLikeProbability } from '../../../../services/math/ProbabilitySolver';

import {
  parseEquation,
  parseQuadraticCoeffs,
  parseLinearCoeffs,
  moveToStandardForm,
  normalizeMathInput,
  type ParsedEquation,
} from '../../../../services/math/EquationParser';
import { create, all } from 'mathjs';

const math = create(all);

export type LinearEquationType =
  | 'one_step'
  | 'two_step'
  | 'variables_both_sides'
  | 'identity'
  | 'no_solution';

export interface LinearAnalysis {
  degree: 1;
  variable: string;
  equationType: LinearEquationType;
  hasVariableOnBothSides: boolean;
  coefficientM: number;
  constantOnLeft: number;
  constantOnRight: number;
}

function evalNumericSide(side: string): number | null {
  try {
    const result = math.evaluate(normalizeMathInput(side));
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function parseSideLinear(side: string, variable: string): { m: number; c: number } | null {
  const coeffs = parseLinearCoeffs(side, variable);
  if (coeffs) return coeffs;
  const numeric = evalNumericSide(side);
  if (numeric !== null) return { m: 0, c: numeric };
  return null;
}

export function analyzeLinearEquation(input: string): LinearAnalysis | null {
  const parsed = parseEquation(input);
  if (!parsed || parsed.problemType !== 'linear') return null;

  const v = parsed.variable;
  const leftLin = parseSideLinear(parsed.left, v);
  if (!leftLin) return null;

  const rightHasVariable = new RegExp(v, 'i').test(parsed.right);
  const rightLin = rightHasVariable
    ? parseSideLinear(parsed.right, v)
    : { m: 0, c: evalNumericSide(parsed.right) ?? 0 };

  if (!rightLin) return null;

  const m = leftLin.m - rightLin.m;
  const cLeft = leftLin.c;
  const rhs = rightLin.c;

  if (!Number.isFinite(m) || !Number.isFinite(cLeft) || !Number.isFinite(rhs)) return null;

  if (m === 0) {
    return {
      degree: 1,
      variable: v,
      equationType: cLeft === rhs ? 'identity' : 'no_solution',
      hasVariableOnBothSides: rightLin.m !== 0,
      coefficientM: 0,
      constantOnLeft: cLeft,
      constantOnRight: rhs,
    };
  }

  const hasVariableOnBothSides = rightLin.m !== 0;
  const hasConstant = cLeft !== 0;
  const needsDivision = Math.abs(m) !== 1;

  let equationType: LinearEquationType;
  if (hasVariableOnBothSides) {
    equationType = 'variables_both_sides';
  } else if (!hasConstant && needsDivision) {
    equationType = 'one_step';
  } else if (hasConstant && needsDivision) {
    equationType = 'two_step';
  } else if (hasConstant) {
    equationType = 'one_step';
  } else {
    equationType = 'one_step';
  }

  return {
    degree: 1,
    variable: v,
    equationType,
    hasVariableOnBothSides,
    coefficientM: m,
    constantOnLeft: cLeft,
    constantOnRight: rhs,
  };
}

export interface ExtractedQuadratic {
  a: number;
  b: number;
  c: number;
  variable: string;
  standardForm: string;
  normalized: string;
}

export function extractQuadraticFromInput(input: string): ExtractedQuadratic | null {
  const parsed = parseEquation(input);
  if (!parsed || parsed.problemType !== 'quadratic') return null;

  const standard = moveToStandardForm(parsed.left, parsed.right, parsed.variable);
  const coeffs = parseQuadraticCoeffs(standard, parsed.variable);
  if (!coeffs || coeffs.a === 0) return null;

  return {
    a: coeffs.a,
    b: coeffs.b,
    c: coeffs.c,
    variable: parsed.variable,
    standardForm: standard,
    normalized: parsed.normalized,
  };
}

export function roundRoot(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
