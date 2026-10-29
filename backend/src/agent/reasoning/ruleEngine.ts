/**
 * Deterministic IF/THEN rule evaluation.
 */

import { RuleDefinition, RuleCondition, RuleAction } from '../types';

export interface RuleEvaluationResult {
  context: Record<string, unknown>;
  appliedRules: string[];
}

export class RuleEngine {
  evaluate(rules: RuleDefinition[], context: Record<string, unknown>): RuleEvaluationResult {
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);
    const result = { ...context };
    const appliedRules: string[] = [];

    for (const rule of sorted) {
      if (this.allConditionsMet(rule.conditions, result)) {
        appliedRules.push(rule.ruleId);
        this.applyActions(rule.actions, result);
      }
    }

    return { context: result, appliedRules };
  }

  private applyActions(actions: RuleAction[], result: Record<string, unknown>): void {
    for (const action of actions) {
      switch (action.type) {
        case 'set':
          if (action.field) result[action.field] = action.value;
          break;
        case 'append':
          if (action.field) {
            const existing = result[action.field];
            result[action.field] = Array.isArray(existing)
              ? [...existing, action.value]
              : [action.value];
          }
          break;
        case 'flag':
          if (action.field) {
            const flags = (result.flags as string[]) ?? [];
            if (!flags.includes(action.field)) {
              result.flags = [...flags, action.field];
            }
          }
          break;
        case 'selectStrategy':
        case 'selectKnowledge':
          if (action.field) result[action.field] = action.value;
          break;
      }
    }
  }

  private allConditionsMet(conditions: RuleCondition[], context: Record<string, unknown>): boolean {
    if (conditions.length === 0) return true;
    return conditions.every((c) => this.evaluateCondition(c, context));
  }

  evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
    const actual = context[condition.field];
    const expected = condition.value;

    switch (condition.operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'gte':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case 'lt':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'lte':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'contains':
        return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
      case 'matches':
        return typeof actual === 'string' && expected instanceof RegExp && expected.test(actual);
      default:
        return false;
    }
  }
}

export const ruleEngine = new RuleEngine();
