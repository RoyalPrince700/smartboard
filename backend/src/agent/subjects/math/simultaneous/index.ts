/**
 * Simultaneous linear equations topic.
 */

import { TopicRegistration } from '../../../types';
import { defaultSimultaneousSolver } from './solvers';
import { simultaneousRules } from './rules';

function classifySimultaneous(input: string) {
  const parts = input
    .split(/\s*(?:;|\band\b|\n)\s*|\s*,\s*(?=[^,=]+=)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const matches = parts.length >= 2 && parts.every((p) => p.includes('='));
  return { matches, confidence: matches ? 0.93 : 0 };
}

export const simultaneousTopic: TopicRegistration = {
  id: 'simultaneous',
  label: 'Simultaneous Equations',
  subtopics: ['elimination', 'substitution', 'two_variables'],
  solvers: { default: defaultSimultaneousSolver },
  rules: simultaneousRules,
  strategies: [],
  knowledgeTypes: ['definition', 'explanation', 'hint', 'worked_step'],
  topicClassifier: classifySimultaneous,
};
