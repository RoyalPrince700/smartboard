/**
 * Exponential equations topic.
 */

import { TopicRegistration } from '../../../types';
import { defaultExponentialSolver } from './solvers';
import { exponentialRules } from './rules';

const EXPONENTIAL_PATTERN = /(?:\d+|e)\^[^=]*[a-zA-Z]/i;

function classifyExponential(input: string) {
  const normalized = input.replace(/\s/g, '');
  const matches = EXPONENTIAL_PATTERN.test(normalized) && normalized.includes('=');
  return { matches, confidence: matches ? 0.9 : 0 };
}

export const exponentialTopic: TopicRegistration = {
  id: 'exponential',
  label: 'Exponential Equations',
  subtopics: ['same_base', 'logarithm', 'compound_exponent'],
  solvers: { default: defaultExponentialSolver },
  rules: exponentialRules,
  strategies: [],
  knowledgeTypes: ['definition', 'formula', 'explanation', 'hint'],
  topicClassifier: classifyExponential,
};
