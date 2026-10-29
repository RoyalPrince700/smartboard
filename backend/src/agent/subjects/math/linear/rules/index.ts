/**
 * Deterministic rules for linear equations.
 * Also stored in MongoDB (agentRules) for content authoring.
 */

import { RuleDefinition } from '../../../../types';

export const linearRules: RuleDefinition[] = [
  {
    ruleId: 'linear_degree_1',
    priority: 100,
    conditions: [{ field: 'degree', operator: 'eq', value: 1 }],
    actions: [{ type: 'set', field: 'problemType', value: 'linear' }],
    description: 'IF equation degree = 1 THEN problem type = linear',
  },
  {
    ruleId: 'linear_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'degree', operator: 'eq', value: 1 }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_equation',
          'collect_variable_terms',
          'move_constants',
          'isolate_variable',
          'state_answer',
        ],
      },
    ],
    description:
      'For JSS-friendly linear teaching, identify the equation, collect terms, move constants, then isolate the variable.',
  },
  {
    ruleId: 'linear_one_step',
    priority: 90,
    conditions: [{ field: 'equationType', operator: 'eq', value: 'one_step' }],
    actions: [{ type: 'set', field: 'linearMethod', value: 'one_step' }],
    description: 'IF only one inverse operation is needed THEN solve in one step',
  },
  {
    ruleId: 'linear_two_step',
    priority: 90,
    conditions: [{ field: 'equationType', operator: 'eq', value: 'two_step' }],
    actions: [{ type: 'set', field: 'linearMethod', value: 'two_step' }],
    description: 'IF two inverse operations are needed THEN solve in two steps',
  },
  {
    ruleId: 'linear_variables_both_sides',
    priority: 92,
    conditions: [{ field: 'equationType', operator: 'eq', value: 'variables_both_sides' }],
    actions: [
      { type: 'set', field: 'linearMethod', value: 'collect_terms' },
      { type: 'set', field: 'hasVariableOnBothSides', value: true },
    ],
    description: 'IF the variable appears on both sides THEN collect variable terms first',
  },
  {
    ruleId: 'linear_identity',
    priority: 88,
    conditions: [{ field: 'equationType', operator: 'eq', value: 'identity' }],
    actions: [
      { type: 'set', field: 'solutionType', value: 'all_real_numbers' },
      { type: 'set', field: 'rootCount', value: Infinity },
    ],
    description: 'IF both sides are identical THEN every real number is a solution',
  },
  {
    ruleId: 'linear_no_solution',
    priority: 88,
    conditions: [{ field: 'equationType', operator: 'eq', value: 'no_solution' }],
    actions: [
      { type: 'set', field: 'solutionType', value: 'no_solution' },
      { type: 'set', field: 'rootCount', value: 0 },
    ],
    description: 'IF constants differ with no variable term THEN there is no solution',
  },
];
