/**
 * Deterministic rules for quadratic equations.
 * Also stored in MongoDB (agentRules) for content authoring.
 */

import { RuleDefinition } from '../../../../types';

export const quadraticRules: RuleDefinition[] = [
  {
    ruleId: 'quadratic_degree_2',
    priority: 100,
    conditions: [{ field: 'degree', operator: 'eq', value: 2 }],
    actions: [{ type: 'set', field: 'problemType', value: 'quadratic' }],
    description: 'IF equation degree = 2 THEN problem type = quadratic',
  },
  {
    ruleId: 'quadratic_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'degree', operator: 'eq', value: 2 }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'standard_form',
          'identify_coefficients',
          'write_formula',
          'substitute_values',
          'square_b',
          'multiply_4ac',
          'combine_signs',
          'interpret_discriminant',
          'apply_quadratic_formula',
          'split_plus_minus_roots',
        ],
      },
    ],
    description:
      'For JSS-friendly quadratic teaching, break every solve into small visible algebra moves before showing the final roots.',
  },
  {
    ruleId: 'discriminant_positive',
    priority: 90,
    conditions: [{ field: 'discriminant', operator: 'gt', value: 0 }],
    actions: [
      { type: 'set', field: 'rootCount', value: 2 },
      { type: 'set', field: 'rootType', value: 'real_distinct' },
    ],
    description: 'IF discriminant > 0 THEN two real roots',
  },
  {
    ruleId: 'discriminant_zero',
    priority: 90,
    conditions: [{ field: 'discriminant', operator: 'eq', value: 0 }],
    actions: [
      { type: 'set', field: 'rootCount', value: 1 },
      { type: 'set', field: 'rootType', value: 'real_repeated' },
    ],
    description: 'IF discriminant = 0 THEN one repeated real root',
  },
  {
    ruleId: 'discriminant_negative',
    priority: 90,
    conditions: [{ field: 'discriminant', operator: 'lt', value: 0 }],
    actions: [
      { type: 'set', field: 'rootCount', value: 0 },
      { type: 'set', field: 'rootType', value: 'complex' },
    ],
    description: 'IF discriminant < 0 THEN complex roots',
  },
];
