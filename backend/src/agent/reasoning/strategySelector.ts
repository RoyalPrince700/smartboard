/**
 * Selects solving strategy based on problem characteristics.
 */

import { StrategyDefinition, RuleCondition } from '../types';
import { ruleEngine } from './ruleEngine';

export interface StrategySelection {
  strategy: StrategyDefinition;
  method: string;
  usedFallback: boolean;
}

export class StrategySelector {
  select(
    strategies: StrategyDefinition[],
    context: Record<string, unknown>
  ): StrategySelection | null {
    const sorted = [...strategies].sort((a, b) => b.priority - a.priority);

    // First: strategies with explicit conditions that match
    for (const strategy of sorted) {
      if (strategy.conditions.length > 0 && this.conditionsMet(strategy.conditions, context)) {
        return { strategy, method: strategy.method, usedFallback: false };
      }
    }

    // Second: strategies with no conditions (defaults)
    for (const strategy of sorted) {
      if (strategy.conditions.length === 0) {
        return { strategy, method: strategy.method, usedFallback: false };
      }
    }

    // Last resort: lowest-priority strategy
    const fallback = sorted[sorted.length - 1];
    if (fallback) {
      return { strategy: fallback, method: fallback.fallback ?? fallback.method, usedFallback: true };
    }

    return null;
  }

  private conditionsMet(conditions: RuleCondition[], context: Record<string, unknown>): boolean {
    if (conditions.length === 0) return true;
    return conditions.every((c) => ruleEngine.evaluateCondition(c, context));
  }
}

export const strategySelector = new StrategySelector();
