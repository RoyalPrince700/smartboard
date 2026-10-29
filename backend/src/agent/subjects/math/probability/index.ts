/**
 * Probability topic registration.
 */

import { TopicRegistration } from '../../../types';
import { AgentContext } from '../../../core/agentContext';
import { defaultProbabilitySolver } from './solvers';
import { probabilityRules } from './rules';
import { looksLikeProbability } from '../../../../services/math/ProbabilitySolver';

function classifyProbability(input: string, context: AgentContext) {
  const matches =
    looksLikeProbability(input) ||
    context.session.topic === 'probability' ||
    context.reasoningTrace?.problemType === 'probability';
  return { matches, confidence: matches ? 0.93 : 0 };
}

export const probabilityTopic: TopicRegistration = {
  id: 'probability',
  label: 'Probability',
  subtopics: [
    'basic_probability',
    'complement',
    'independent_events',
    'mutually_exclusive',
    'combinations',
    'permutations',
  ],
  solvers: { default: defaultProbabilitySolver },
  rules: probabilityRules,
  strategies: [],
  knowledgeTypes: ['definition', 'formula', 'explanation', 'hint', 'worked_step'],
  topicClassifier: classifyProbability,
};
