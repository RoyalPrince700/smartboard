/**
 * Linear equations topic.
 */

import { TopicRegistration } from '../../../types';
import { defaultLinearSolver } from './solvers';
import { linearRules } from './rules';
import { linearStrategies } from './strategies';

const VARIABLE_PATTERN = /[a-zA-Z]/;
const QUADRATIC_PATTERN = /[a-zA-Z]\s*(?:\^?\s*2|²)/;
const HIGHER_DEGREE_PATTERN = /[a-zA-Z]\s*\^\s*[3-9]/;

function classifyLinear(input: string) {
  const isNamedLinear = /\blinear\b/i.test(input);
  const looksLikeEquation = input.includes('=') && VARIABLE_PATTERN.test(input);
  const matches =
    (isNamedLinear || looksLikeEquation) &&
    !QUADRATIC_PATTERN.test(input) &&
    !HIGHER_DEGREE_PATTERN.test(input);

  return {
    matches,
    confidence: matches ? (isNamedLinear ? 0.8 : 0.75) : 0,
  };
}

export const linearTopic: TopicRegistration = {
  id: 'linear',
  label: 'Linear Equations',
  subtopics: ['one_step', 'two_step', 'variables_both_sides'],
  solvers: {
    default: defaultLinearSolver,
  },
  rules: linearRules,
  strategies: linearStrategies,
  knowledgeTypes: ['definition', 'explanation', 'hint'],
  topicClassifier: classifyLinear,
};
