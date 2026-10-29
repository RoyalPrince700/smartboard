/**
 * Strategy definitions for linear equation solving.
 */

import { StrategyDefinition } from '../../../../types';

export const linearStrategies: StrategyDefinition[] = [
  {
    strategyId: 'collect_variable_terms',
    priority: 20,
    conditions: [{ field: 'hasVariableOnBothSides', operator: 'eq', value: true }],
    method: 'default',
    fallback: undefined,
    description: 'When the variable is on both sides, collect all variable terms on one side first',
  },
  {
    strategyId: 'default_isolate_variable',
    priority: 10,
    conditions: [],
    method: 'default',
    fallback: undefined,
    description: 'Default: isolate the variable using inverse operations on both sides',
  },
];
