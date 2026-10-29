/**
 * Strategy definitions for quadratic solving method selection.
 */

import { StrategyDefinition } from '../../../../types';

export const quadraticStrategies: StrategyDefinition[] = [
  {
    strategyId: 'prefer_factorization',
    priority: 20,
    conditions: [{ field: 'factorizable', operator: 'eq', value: true }],
    method: 'factorization',
    fallback: 'quadratic_formula',
    description: 'If factorization is straightforward, prefer factorization',
  },
  {
    strategyId: 'default_quadratic_formula',
    priority: 10,
    conditions: [],
    method: 'quadratic_formula',
    fallback: undefined,
    description: 'Default to quadratic formula when factorization is not preferred',
  },
];
