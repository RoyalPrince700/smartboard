/**
 * Deterministic rules for exponential equations.
 */

import { RuleDefinition } from '../../../../types';

export const exponentialRules: RuleDefinition[] = [
  {
    ruleId: 'exponential_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'exponential' }],
    actions: [{ type: 'set', field: 'topic', value: 'exponential' }],
    description: 'IF the variable is in the exponent THEN use exponential equation rules',
  },
  {
    ruleId: 'exponential_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'exponential' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_equation',
          'identify_base_exponent',
          'rewrite_same_base',
          'equate_exponents',
          'state_answer',
        ],
      },
    ],
    description: 'Break exponential solving into base identification, same-base rewrite, and equating exponents.',
  },
  {
    ruleId: 'exponential_same_base',
    priority: 90,
    conditions: [{ field: 'sameBasePossible', operator: 'eq', value: true }],
    actions: [{ type: 'set', field: 'method', value: 'equate_exponents' }],
    description: 'IF both sides can be written with the same base THEN equate the exponents',
  },
  {
    ruleId: 'exponential_use_logarithm',
    priority: 85,
    conditions: [{ field: 'sameBasePossible', operator: 'eq', value: false }],
    actions: [{ type: 'set', field: 'method', value: 'logarithm' }],
    description: 'IF same base is not possible THEN take logarithms of both sides',
  },
];
