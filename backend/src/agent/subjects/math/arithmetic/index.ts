/**
 * Arithmetic expressions topic.
 */

import { TopicRegistration } from '../../../types';
import { defaultArithmeticSolver } from './solvers';
import { arithmeticRules } from './rules';

export function isArithmeticExpression(input: string): boolean {
  const normalized = input.replace(/\s/g, '');
  const hasVariable = /[a-zA-Z]/.test(normalized);
  const hasOperator = /[+\-*/^=]/.test(normalized);
  const hasDigit = /\d/.test(normalized);
  return (
    hasOperator &&
    hasDigit &&
    !hasVariable &&
    !/\|/.test(normalized) &&
    !/(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(normalized)
  );
}

function classifyArithmetic(input: string) {
  const matches = isArithmeticExpression(input);
  const normalized = input.replace(/\s/g, '');
  const confidence = matches
    ? normalized.includes('=')
      ? 0.96
      : 0.9
    : 0;
  return { matches, confidence };
}

export const arithmeticTopic: TopicRegistration = {
  id: 'arithmetic',
  label: 'Arithmetic',
  subtopics: ['order_of_operations', 'fractions', 'verification'],
  solvers: { default: defaultArithmeticSolver },
  rules: arithmeticRules,
  strategies: [],
  knowledgeTypes: ['definition', 'explanation', 'hint'],
  topicClassifier: classifyArithmetic,
};
