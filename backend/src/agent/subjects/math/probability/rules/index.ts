/**
 * Deterministic rules for probability questions.
 */

import { RuleDefinition } from '../../../../types';

export const probabilityRules: RuleDefinition[] = [
  {
    ruleId: 'probability_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'probability' }],
    actions: [{ type: 'set', field: 'topic', value: 'probability' }],
    description: 'IF the input is a probability question THEN use probability rules',
  },
  {
    ruleId: 'probability_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'probability' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_sample_space',
          'count_favorable_outcomes',
          'apply_probability_formula',
          'state_answer',
        ],
      },
    ],
    description: 'Break probability into sample space, favorable count, formula, and answer.',
  },
  {
    ruleId: 'probability_complement',
    priority: 90,
    conditions: [{ field: 'probabilityKind', operator: 'eq', value: 'complement' }],
    actions: [{ type: 'set', field: 'method', value: 'complement_rule' }],
    description: 'IF finding P(not A) THEN use P(A\') = 1 − P(A)',
  },
  {
    ruleId: 'probability_independent_and',
    priority: 90,
    conditions: [{ field: 'probabilityKind', operator: 'eq', value: 'independent_and' }],
    actions: [{ type: 'set', field: 'method', value: 'multiply_independent' }],
    description: 'IF independent events AND THEN multiply probabilities',
  },
  {
    ruleId: 'probability_combination',
    priority: 85,
    conditions: [{ field: 'probabilityKind', operator: 'eq', value: 'combination' }],
    actions: [{ type: 'set', field: 'method', value: 'nCr' }],
    description: 'IF choosing r from n THEN use nCr = n! / (r!(n−r)!)',
  },
];
