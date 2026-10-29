/**
 * Deterministic rules for simultaneous linear equations.
 */

import { RuleDefinition } from '../../../../types';

export const simultaneousRules: RuleDefinition[] = [
  {
    ruleId: 'simultaneous_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'simultaneous' }],
    actions: [{ type: 'set', field: 'topic', value: 'simultaneous' }],
    description: 'IF two or more equations share variables THEN use simultaneous equation rules',
  },
  {
    ruleId: 'simultaneous_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'simultaneous' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_equations',
          'standard_form',
          'identify_coefficients',
          'choose_elimination_variable',
          'match_coefficients',
          'multiply_equation',
          'add_or_subtract_equations',
          'combine_like_terms',
          'isolate_first_variable',
          'calculate_first_variable',
          'substitute_back',
          'evaluate_substitution',
          'solve_second_variable',
          'verify_solution',
          'state_answer',
        ],
      },
    ],
    description:
      'For JSS-friendly simultaneous teaching, break elimination into small visible algebra moves before showing the final answer.',
  },
  {
    ruleId: 'simultaneous_elimination',
    priority: 90,
    conditions: [{ field: 'equationCount', operator: 'eq', value: 2 }],
    actions: [{ type: 'set', field: 'method', value: 'elimination' }],
    description: 'IF there are two linear equations THEN use elimination or substitution',
  },
];
