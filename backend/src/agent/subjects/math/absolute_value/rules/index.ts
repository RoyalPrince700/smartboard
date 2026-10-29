/**
 * Deterministic rules for absolute value equations.
 */

import { RuleDefinition } from '../../../../types';

export const absoluteValueRules: RuleDefinition[] = [
  {
    ruleId: 'absolute_value_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'absolute_value' }],
    actions: [{ type: 'set', field: 'topic', value: 'absolute_value' }],
    description: 'IF the equation contains |...| THEN use absolute value rules',
  },
  {
    ruleId: 'absolute_value_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'absolute_value' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_equation',
          'split_two_cases',
          'solve_case_positive',
          'solve_case_negative',
          'combine_solutions',
        ],
      },
    ],
    description: 'Split absolute value equations into positive and negative cases before combining solutions.',
  },
  {
    ruleId: 'absolute_value_two_cases',
    priority: 90,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'absolute_value' }],
    actions: [
      { type: 'set', field: 'caseCount', value: 2 },
      { type: 'set', field: 'method', value: 'split_cases' },
    ],
    description: 'IF |A| = k THEN solve A = k and A = -k',
  },
];
