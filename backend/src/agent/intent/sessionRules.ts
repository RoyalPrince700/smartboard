/**
 * Session-aware intent rules — evaluated before base patterns.
 */

import { SessionIntentRule } from './types';

const AFFIRMATIVE = /^(yes|ok(ay)?|sure|yep|yeah|continue|next|go on|proceed)\.?$/i;
const WHY_COEFFICIENT = /\bwhy\s+is\s+(?:the\s+)?([abc])\b/i;

export const SESSION_INTENT_RULES: SessionIntentRule[] = [
  {
    id: 'affirmative_after_unresolved',
    priority: 120,
    match: (input, ctx) =>
      Boolean(ctx.session?.unresolvedQuestion) && AFFIRMATIVE.test(input.trim()),
    resolve: () => ({
      intent: 'CONTINUE',
      confidence: 0.93,
      metadata: { rule: 'affirmative_after_unresolved' },
    }),
  },
  {
    id: 'continue_with_active_problem',
    priority: 115,
    match: (input, ctx) =>
      Boolean(ctx.hasActiveProblem) && AFFIRMATIVE.test(input.trim()),
    resolve: () => ({
      intent: 'CONTINUE',
      confidence: 0.94,
      metadata: { rule: 'continue_with_active_problem' },
    }),
  },
  {
    id: 'why_coefficient_in_context',
    priority: 110,
    match: (input, ctx) =>
      Boolean(ctx.hasActiveProblem) && WHY_COEFFICIENT.test(input),
    resolve: (input) => ({
      intent: 'ASK_WHY',
      confidence: 0.96,
      metadata: {
        rule: 'why_coefficient_in_context',
        coefficient: input.match(WHY_COEFFICIENT)?.[1]?.toLowerCase(),
      },
    }),
  },
  {
    id: 'simpler_after_concept',
    priority: 108,
    match: (input, ctx) =>
      Boolean(ctx.session?.currentConcept) &&
      /\b(don'?t|do not) understand\b/i.test(input),
    resolve: (_, ctx) => ({
      intent: 'REQUEST_SIMPLER_EXPLANATION',
      confidence: 0.92,
      metadata: {
        rule: 'simpler_after_concept',
        concept: ctx.session?.currentConcept,
      },
    }),
  },
  {
    id: 'start_problem_equation_no_active',
    priority: 105,
    match: (input, ctx) => {
      if (ctx.hasActiveProblem) return false;
      return (
        /\bsolve\b/i.test(input) ||
        (/[=]/.test(input) && /x/.test(input)) ||
        /x\s*\^?\s*2/i.test(input)
      );
    },
    resolve: () => ({
      intent: 'START_PROBLEM',
      confidence: 0.88,
      metadata: { rule: 'start_problem_equation_no_active' },
    }),
  },
  {
    id: 'block_continue_without_problem',
    priority: 200,
    match: (input, ctx) =>
      !ctx.hasActiveProblem && AFFIRMATIVE.test(input.trim()) && !ctx.session?.unresolvedQuestion,
    resolve: () => ({
      intent: 'UNKNOWN',
      confidence: 0.3,
      metadata: { rule: 'block_continue_without_problem', reason: 'no_active_problem' },
    }),
  },
];

export const SORTED_SESSION_RULES = [...SESSION_INTENT_RULES].sort(
  (a, b) => b.priority - a.priority
);
