/**
 * Presentation rules per teaching mode.
 * No calculations — pedagogical display decisions only.
 */

import { AgentIntent } from '../core/intentEngine';
import { TeachingMode } from '../core/teachingEngine';
import { KnowledgeType, TeachingPresentation } from '../types';

const ALL_KNOWLEDGE_TYPES: KnowledgeType[] = [
  'definition',
  'concept',
  'formula',
  'explanation',
  'hint',
  'misconception',
  'worked_step',
  'teaching_note',
];

const BASE_PRESENTATIONS: Record<TeachingMode, TeachingPresentation> = {
  DIRECT: {
    includeReasoningSteps: true,
    includeCoefficients: true,
    includeAnswer: true,
    includeVerification: true,
    knowledgeTypes: ['definition', 'explanation', 'formula', 'worked_step'],
    reasoningStepFilter: 'all',
    maxKnowledgeDocs: 6,
  },
  GUIDED: {
    includeReasoningSteps: true,
    includeCoefficients: true,
    includeAnswer: false,
    includeVerification: false,
    knowledgeTypes: ['explanation', 'hint', 'worked_step', 'teaching_note'],
    reasoningStepFilter: 'current',
    maxKnowledgeDocs: 2,
  },
  SOCRATIC: {
    includeReasoningSteps: false,
    includeCoefficients: false,
    includeAnswer: false,
    includeVerification: false,
    knowledgeTypes: ['teaching_note'],
    reasoningStepFilter: 'none',
    addSocraticPrompt: true,
    maxKnowledgeDocs: 1,
  },
  HINT: {
    includeReasoningSteps: false,
    includeCoefficients: false,
    includeAnswer: false,
    includeVerification: false,
    knowledgeTypes: ['hint'],
    reasoningStepFilter: 'none',
    maxKnowledgeDocs: 1,
  },
  EXAM: {
    includeReasoningSteps: false,
    includeCoefficients: false,
    includeAnswer: false,
    includeVerification: true,
    knowledgeTypes: [],
    reasoningStepFilter: 'none',
    maxKnowledgeDocs: 0,
  },
  PRACTICE: {
    includeReasoningSteps: false,
    includeCoefficients: false,
    includeAnswer: false,
    includeVerification: false,
    knowledgeTypes: ['explanation', 'worked_step'],
    reasoningStepFilter: 'none',
    maxKnowledgeDocs: 2,
  },
};

/** Maps guided pipeline step IDs to reasoning trace step actions */
export const STEP_ACTION_MAP: Record<string, string[]> = {
  identify_coefficients: ['parse', 'identify_coefficients'],
  discriminant: ['calculate_discriminant'],
  select_method: ['select_strategy', 'apply_rule'],
  solve: ['quadratic_formula', 'factorization', 'calculate_roots', 'linear_step'],
  verify: ['verify'],
  identify_shape: ['parse', 'identify_shape'],
  list_givens: ['list_givens'],
  choose_formula: ['choose_formula'],
  calculate: ['calculate_area', 'calculate_perimeter', 'calculate_circumference', 'calculate_hypotenuse'],
  state_answer: ['calculate_area', 'calculate_perimeter', 'calculate_hypotenuse'],
};

export const SOCRATIC_PROMPTS: Record<string, string> = {
  identify_coefficients:
    'Look at the equation in standard form ax² + bx + c = 0. What are the values of a, b, and c?',
  discriminant:
    'What expression involving a, b, and c tells you how many real roots the equation has?',
  select_method:
    'Based on the discriminant, which method might be most efficient — factorization or the quadratic formula?',
  solve: 'How would you apply your chosen method to find the values of x?',
  verify: 'How can you check that your roots are correct?',
  identify_shape: 'Look at the drawing. Is this a triangle, rectangle, square, or circle?',
  list_givens: 'Which lengths are labelled on the shape? Write them with units.',
  choose_formula: 'Which formula matches this shape — area, perimeter, or Pythagoras?',
  calculate: 'Substitute the given lengths into the formula. What do you get?',
  state_answer: 'What is the final answer, and should the unit be cm or cm²?',
};

export function getPresentationForMode(
  mode: TeachingMode,
  intent: AgentIntent
): TeachingPresentation {
  const base = { ...BASE_PRESENTATIONS[mode] };

  if (mode === 'DIRECT' && intent === 'REQUEST_SIMPLER_EXPLANATION') {
    return {
      ...base,
      knowledgeTypes: ['explanation', 'definition'],
      maxKnowledgeDocs: 3,
    };
  }

  if (mode === 'EXAM' && (intent === 'SUBMIT_ANSWER' || intent === 'CHECK_ANSWER')) {
    return {
      ...base,
      includeVerification: true,
      includeAnswer: false,
    };
  }

  if (mode === 'DIRECT' && (intent === 'ASK_DEFINITION' || intent === 'ASK_WHY')) {
    return {
      ...base,
      includeReasoningSteps: false,
      includeAnswer: false,
      knowledgeTypes: ['definition', 'explanation', 'misconception'],
      maxKnowledgeDocs: 4,
    };
  }

  if (mode === 'PRACTICE' && intent === 'REQUEST_PRACTICE') {
    return {
      ...base,
      knowledgeTypes: ['explanation', 'worked_step'],
      maxKnowledgeDocs: 1,
    };
  }

  return base;
}

export function getSocraticPrompt(stepId?: string): string {
  if (stepId && SOCRATIC_PROMPTS[stepId]) return SOCRATIC_PROMPTS[stepId];
  return 'What do you already know about this problem that could help you take the next step?';
}

export { ALL_KNOWLEDGE_TYPES };
