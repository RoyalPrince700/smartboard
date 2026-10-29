/**
 * Trigonometry topic registration.
 */

import { TopicRegistration } from '../../../types';
import { AgentContext } from '../../../core/agentContext';
import { trigonometryRules } from './rules';
import { defaultTrigonometrySolver } from './solvers';

const TRIG_PATTERN =
  /\b(?:sin|sine|cos|cosine|tan|tangent)\b|(?:^|[^a-zA-Z])(?:sin|cos|tan)(?=\d|\()/i;
const TRIG_DIAGRAM_PATTERN =
  /\[trigonometry\]|(?:θ|theta)|shape\s*=\s*triangle.*find\s*=\s*unknown_angle/i;

function classifyTrigonometry(input: string, context: AgentContext) {
  const matches =
    TRIG_PATTERN.test(input) ||
    TRIG_DIAGRAM_PATTERN.test(input) ||
    context.session.topic === 'trigonometry';
  return { matches, confidence: matches ? 0.9 : 0 };
}

export const trigonometryTopic: TopicRegistration = {
  id: 'trigonometry',
  label: 'Trigonometry',
  subtopics: ['sine', 'cosine', 'tangent', 'common_angles', 'unknown_angles'],
  solvers: {
    default: defaultTrigonometrySolver,
  },
  rules: trigonometryRules,
  strategies: [],
  knowledgeTypes: ['definition', 'formula', 'explanation', 'hint', 'worked_step'],
  topicClassifier: classifyTrigonometry,
};
