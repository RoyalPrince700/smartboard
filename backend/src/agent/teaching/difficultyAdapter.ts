/**
 * Adjusts teaching presentation based on student difficulty level.
 * No calculations — content selection only.
 */

import { AgentContext } from '../core/agentContext';
import { TeachingPresentation, DifficultyLevel } from '../types';

export function adaptPresentationForDifficulty(
  presentation: TeachingPresentation,
  context: AgentContext
): TeachingPresentation {
  const difficulty = context.difficulty ?? 'beginner';

  switch (difficulty) {
    case 'beginner':
      return adaptForBeginner(presentation, context);
    case 'advanced':
      return adaptForAdvanced(presentation);
    default:
      return presentation;
  }
}

function adaptForBeginner(
  presentation: TeachingPresentation,
  context: AgentContext
): TeachingPresentation {
  const wantsSimpler =
    context.intent.intent === 'REQUEST_SIMPLER_EXPLANATION' ||
    context.session.unresolvedQuestion === 'REQUEST_SIMPLER_EXPLANATION';

  return {
    ...presentation,
    knowledgeTypes: wantsSimpler
      ? ['explanation', 'definition', 'hint']
      : [...presentation.knowledgeTypes],
    maxKnowledgeDocs:
      presentation.maxKnowledgeDocs === 0
        ? 0
        : Math.max(presentation.maxKnowledgeDocs, wantsSimpler ? 2 : 1),
    includeCoefficients: presentation.includeCoefficients || wantsSimpler,
  };
}

function adaptForAdvanced(presentation: TeachingPresentation): TeachingPresentation {
  return {
    ...presentation,
    maxKnowledgeDocs: Math.min(presentation.maxKnowledgeDocs, 3),
    knowledgeTypes: presentation.knowledgeTypes.filter(
      (t) => t !== 'teaching_note' && t !== 'hint'
    ),
  };
}

export function preferredKnowledgeDifficulty(context: AgentContext): DifficultyLevel {
  if (context.intent.intent === 'REQUEST_SIMPLER_EXPLANATION') return 'beginner';
  return context.difficulty ?? 'beginner';
}
