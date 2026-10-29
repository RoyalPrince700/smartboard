/**
 * Deterministic rules for arithmetic expressions.
 */

import { RuleDefinition } from '../../../../types';

export const arithmeticRules: RuleDefinition[] = [
  {
    ruleId: 'arithmetic_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'arithmetic' }],
    actions: [{ type: 'set', field: 'topic', value: 'arithmetic' }],
    description: 'IF the input is a numeric expression THEN evaluate using order of operations',
  },
  {
    ruleId: 'arithmetic_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'arithmetic' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: ['identify_expression', 'apply_order_of_operations', 'calculate', 'state_answer'],
      },
    ],
    description: 'Break arithmetic into identify, order of operations, and calculate steps.',
  },
  {
    ruleId: 'arithmetic_addition_chain',
    priority: 90,
    conditions: [
      { field: 'problemType', operator: 'eq', value: 'arithmetic' },
    ],
    actions: [{ type: 'set', field: 'operationFamily', value: 'addition_subtraction' }],
    description: 'IF the expression uses only + and − THEN add terms step by step from left to right after ×, ÷, and powers.',
  },
  {
    ruleId: 'arithmetic_multiplication_division',
    priority: 89,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'arithmetic' }],
    actions: [{ type: 'set', field: 'requiresOrderOfOperations', value: true }],
    description: 'IF the expression contains ×, ÷, or ^ THEN apply BIDMAS before addition and subtraction.',
  },
  {
    ruleId: 'arithmetic_incomplete_equation',
    priority: 88,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'arithmetic' }],
    actions: [{ type: 'set', field: 'equationForm', value: 'evaluate_left_side' }],
    description: 'IF the equation ends with = and no right-hand value THEN evaluate the left side and state the result.',
  },
  {
    ruleId: 'arithmetic_state_numeric_answer',
    priority: 87,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'arithmetic' }],
    actions: [{ type: 'set', field: 'answerFormat', value: 'numeric' }],
    description: 'IF solving basic arithmetic THEN return a single numeric answer.',
  },
];
