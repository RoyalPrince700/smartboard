/**
 * Resolves contextual references in student messages against active session state.
 * Pure resolution — does not mutate session (caller applies updates).
 */

import { TutorSessionData } from '../schemas/conversation.schema';
import { AgentIntent } from '../core/intentEngine';

const COEFFICIENT_PATTERN = /\b([abc])\b/i;
const WHY_COEFFICIENT_PATTERN = /\bwhy\s+is\s+(?:the\s+)?([abc])\s+([-+]?\d+(?:\.\d+)?)?/i;
const CONCEPT_TERMS = [
  'discriminant',
  'factorization',
  'factorisation',
  'quadratic formula',
  'roots',
  'vertex',
  'parabola',
  'standard form',
];

export interface ResolvedContext {
  references: Record<string, unknown>;
  /** Updated concept to persist on session */
  currentConcept?: string;
  /** Whether message refers to the active problem */
  refersToActiveProblem: boolean;
  /** Whether CONTINUE-style progression is implied */
  impliesContinuation: boolean;
}

export class ContextManager {
  resolve(message: string, session: TutorSessionData, intent?: AgentIntent): ResolvedContext {
    const references: Record<string, unknown> = {};
    const lower = message.toLowerCase().trim();
    const hasActiveProblem = Boolean(session.currentProblem?.rawInput);

    this.resolveProblemReferences(message, lower, session, references);
    this.resolveCoefficientReferences(message, session, references);
    this.resolveConceptReferences(lower, references);
    this.resolveStepReferences(message, session, references);

    const refersToActiveProblem =
      hasActiveProblem &&
      (references.activeProblem === true ||
        Boolean(references.a ?? references.b ?? references.c) ||
        /\b(this|the)\s+(equation|problem|question)\b/i.test(message));

    const impliesContinuation =
      intent === 'CONTINUE' ||
      /^(continue|next|go on|proceed|yes|ok(ay)?|sure)\.?$/i.test(lower);

    return {
      references,
      currentConcept: references.currentConcept as string | undefined,
      refersToActiveProblem,
      impliesContinuation,
    };
  }

  /** @deprecated Use resolve() — kept for backward compatibility */
  resolveReferences(message: string, session: TutorSessionData): Record<string, unknown> {
    return this.resolve(message, session).references;
  }

  private resolveProblemReferences(
    message: string,
    lower: string,
    session: TutorSessionData,
    refs: Record<string, unknown>
  ): void {
    if (!session.currentProblem) return;

    if (
      /\b(this|the|current)\s+(equation|problem|question)\b/i.test(message) ||
      /\b(in this|for this)\b/i.test(lower)
    ) {
      refs.activeProblem = true;
      refs.problemInput = session.currentProblem.rawInput;
      if (session.currentProblem.coefficients) {
        Object.assign(refs, session.currentProblem.coefficients);
      }
    }
  }

  private resolveCoefficientReferences(
    message: string,
    session: TutorSessionData,
    refs: Record<string, unknown>
  ): void {
    const coeffs = session.currentProblem?.coefficients;
    if (!coeffs) return;

    const whyMatch = message.match(WHY_COEFFICIENT_PATTERN);
    if (whyMatch) {
      const key = whyMatch[1].toLowerCase();
      if (key in coeffs) {
        refs[key] = coeffs[key];
        refs.concept = `coefficient_${key}`;
        refs.referenceType = 'coefficient_why';
        if (whyMatch[2] !== undefined) {
          refs.askedValue = parseFloat(whyMatch[2]);
        }
      }
      return;
    }

    const coeffMatch = message.match(COEFFICIENT_PATTERN);
    if (coeffMatch) {
      const key = coeffMatch[1].toLowerCase();
      if (key in coeffs) {
        refs[key] = coeffs[key];
        refs.concept = `coefficient_${key}`;
        refs.referenceType = 'coefficient';
      }
    }
  }

  private resolveConceptReferences(lower: string, refs: Record<string, unknown>): void {
    for (const term of CONCEPT_TERMS) {
      if (lower.includes(term)) {
        refs.currentConcept = term.replace(/\s+/g, '_');
        break;
      }
    }
  }

  private resolveStepReferences(
    message: string,
    session: TutorSessionData,
    refs: Record<string, unknown>
  ): void {
    refs.currentStep = session.currentStep;

    if (/\b(this|that|current)\s+step\b/i.test(message)) {
      refs.referenceType = 'current_step';
    }

    if (/\b(last|previous)\s+step\b/i.test(message) && session.completedSteps.length > 0) {
      const last = session.completedSteps[session.completedSteps.length - 1];
      refs.lastCompletedStep = last.step;
      refs.lastCompletedStepTitle = last.title;
      refs.referenceType = 'last_step';
    }

    if (session.currentProblem?.intermediateResults) {
      refs.intermediateResults = session.currentProblem.intermediateResults;
    }
  }
}

export const contextManager = new ContextManager();
