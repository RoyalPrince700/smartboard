/**
 * Absolute value equations topic.
 */

import { TopicRegistration } from '../../../types';
import { defaultAbsoluteValueSolver } from './solvers';
import { absoluteValueRules } from './rules';

function classifyAbsoluteValue(input: string) {
  const matches = /\|[^|]+\|/.test(input) && input.includes('=');
  return { matches, confidence: matches ? 0.92 : 0 };
}

export const absoluteValueTopic: TopicRegistration = {
  id: 'absolute_value',
  label: 'Absolute Value Equations',
  subtopics: ['split_cases', 'linear_inside'],
  solvers: { default: defaultAbsoluteValueSolver },
  rules: absoluteValueRules,
  strategies: [],
  knowledgeTypes: ['definition', 'explanation', 'hint'],
  topicClassifier: classifyAbsoluteValue,
};
