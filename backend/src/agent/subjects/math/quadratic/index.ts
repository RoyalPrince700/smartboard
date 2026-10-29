/**
 * Quadratic topic registration.
 */

import { TopicRegistration } from '../../../types';
import { AgentContext } from '../../../core/agentContext';
import { quadraticRules } from './rules';
import { quadraticStrategies } from './strategies';
import { defaultQuadraticSolver, quadraticFormulaSolver, factorizationSolver } from './solvers';

const QUADRATIC_PATTERN = /[a-zA-Z]\s*(?:\^?\s*2|²)/;

function classifyQuadratic(input: string, _context: AgentContext) {
  const matches = QUADRATIC_PATTERN.test(input);
  return { matches, confidence: matches ? 0.85 : 0 };
}

export const quadraticTopic: TopicRegistration = {
  id: 'quadratic',
  label: 'Quadratic Equations',
  subtopics: [
    'standard_form',
    'coefficients',
    'discriminant',
    'factorization',
    'quadratic_formula',
    'completing_the_square',
    'roots',
  ],
  solvers: {
    default: defaultQuadraticSolver,
    quadratic_formula: quadraticFormulaSolver,
    factorization: factorizationSolver,
  },
  rules: quadraticRules,
  strategies: quadraticStrategies,
  knowledgeTypes: [
    'definition',
    'formula',
    'explanation',
    'hint',
    'misconception',
    'worked_step',
  ],
  topicClassifier: classifyQuadratic,
};
