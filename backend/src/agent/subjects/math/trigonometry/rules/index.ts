/**
 * Deterministic rules for introductory trigonometry.
 */

import { RuleDefinition } from '../../../../types';

export const trigonometryRules: RuleDefinition[] = [
  {
    ruleId: 'trig_function_detected',
    priority: 100,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'trigonometry' }],
    actions: [{ type: 'set', field: 'topic', value: 'trigonometry' }],
    description: 'IF a trigonometric function is present THEN use trigonometry rules.',
  },
  {
    ruleId: 'trig_known_angle_value',
    priority: 90,
    conditions: [{ field: 'trigTask', operator: 'eq', value: 'evaluate_known_angle' }],
    actions: [{ type: 'set', field: 'method', value: 'known_angle_table' }],
    description: 'IF the trig question uses a common angle THEN use the known-angle table.',
  },
  {
    ruleId: 'trig_unknown_angle',
    priority: 80,
    conditions: [{ field: 'trigTask', operator: 'eq', value: 'find_angle' }],
    actions: [{ type: 'set', field: 'method', value: 'inverse_trig_common_angle' }],
    description: 'IF the angle is unknown THEN use inverse trig with common angle values.',
  },
];
