/**
 * Quadratic solvers — orchestrates parse, coefficients, discriminant, formula, factorization, verify.
 */

import { AgentContext } from '../../../../core/agentContext';
import { reasoningTraceBuilder } from '../../../../reasoning/reasoningTrace';
import { createEmptyTrace, ReasoningTrace } from '../../../../schemas/reasoning.schema';
import { PartialReasoningTrace } from '../types';
import { extractQuadraticFromInput } from '../../shared/equationAdapter';
import { parseToTrace } from './parser';
import { discriminantStep } from './discriminantCalculator';
import { solveByQuadraticFormula } from './quadraticFormulaSolver';
import { isFactorizable, solveByFactorization } from './factorizationSolver';
import { verifyRootsWithDetails } from './rootVerifier';

function merge(...partials: PartialReasoningTrace[]): PartialReasoningTrace {
  return partials.reduce<ReasoningTrace>(
    (acc, p) => reasoningTraceBuilder.merge(acc, p),
    createEmptyTrace()
  );
}

function buildFromCoefficients(
  a: number,
  b: number,
  c: number,
  variable: string,
  input: string
): PartialReasoningTrace {
  const parseTrace = parseToTrace(input) ?? {
    problemType: 'quadratic' as const,
    recognizedData: { a, b, c, degree: 2, variable },
    reasoningSteps: [],
  };

  const discTrace = discriminantStep(a, b, c);
  const factorizable = isFactorizable(a, b, c);
  const formulaTrace = solveByQuadraticFormula(a, b, c, variable);

  const roots = formulaTrace.recognizedData?.roots as number[] | undefined;
  let verifyTrace: PartialReasoningTrace = {};
  if (roots?.length) {
    const verification = verifyRootsWithDetails(a, b, c, roots);
    verifyTrace = {
      reasoningSteps: [
        {
          order: 1,
          action: 'verify',
          description: verification.valid ? 'Roots verified by substitution' : 'Verification failed',
          data: { checks: verification.checks, valid: verification.valid },
        },
      ],
    };
  }

  return merge(parseTrace, discTrace, {
    recognizedData: { factorizable, degree: 2, a, b, c, variable },
    problemType: 'quadratic',
  }, formulaTrace, verifyTrace);
}

function resolveQuadraticInput(context: AgentContext): string {
  const fromMessage = context.normalizedInput || context.rawInput;
  if (extractQuadraticFromInput(fromMessage)) return fromMessage;

  const stored = context.session.currentProblem?.rawInput;
  if (stored && extractQuadraticFromInput(stored)) return stored;

  return fromMessage;
}

/** Default solver — full pipeline via quadratic formula */
export function defaultQuadraticSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveQuadraticInput(context);
  const extracted = extractQuadraticFromInput(input);

  if (!extracted) {
    return {
      problemType: 'quadratic',
      flags: ['parse_failed'],
      reasoningSteps: [
        { order: 1, action: 'parse', description: 'Could not parse quadratic equation from input' },
      ],
    };
  }

  return buildFromCoefficients(
    extracted.a,
    extracted.b,
    extracted.c,
    extracted.variable,
    input
  );
}

export function quadraticFormulaSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveQuadraticInput(context);
  const extracted = extractQuadraticFromInput(input);
  if (!extracted) return defaultQuadraticSolver(context);

  return merge(
    parseToTrace(input) ?? { reasoningSteps: [] },
    discriminantStep(extracted.a, extracted.b, extracted.c),
    solveByQuadraticFormula(extracted.a, extracted.b, extracted.c, extracted.variable)
  );
}

export function factorizationSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveQuadraticInput(context);
  const extracted = extractQuadraticFromInput(input);
  if (!extracted) return defaultQuadraticSolver(context);

  const factTrace = solveByFactorization(
    extracted.a,
    extracted.b,
    extracted.c,
    extracted.variable
  );

  if (factTrace.flags?.includes('factorization_not_applicable')) {
    return quadraticFormulaSolver(context);
  }

  return merge(parseToTrace(input) ?? { reasoningSteps: [] }, factTrace);
}

export { defaultQuadraticSolver as parseAndAnalyze };
