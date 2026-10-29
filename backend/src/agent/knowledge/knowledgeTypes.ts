/**
 * Knowledge type constants and query helpers.
 */

export {
  type KnowledgeType,
  type KnowledgeQuery,
  type DifficultyLevel,
} from '../types';

export const KNOWLEDGE_TYPES = [
  'definition',
  'concept',
  'formula',
  'rule',
  'explanation',
  'hint',
  'misconception',
  'teaching_note',
  'worked_step',
  'vocabulary',
  'pattern',
] as const;

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
