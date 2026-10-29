/**
 * Resolves {{placeholder}} tokens in knowledge and response content.
 * Pure string substitution — no calculations.
 */

import { AgentContext } from '../core/agentContext';

export const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

export interface PlaceholderMap {
  [key: string]: string | number | undefined;
}

/** Build a flat map of all resolvable placeholders from agent context */
export function buildPlaceholderMap(context: AgentContext): PlaceholderMap {
  const map: PlaceholderMap = {};

  const coeffs = context.session.currentProblem?.coefficients ?? {};
  for (const [key, value] of Object.entries(coeffs)) {
    map[key] = value;
  }

  const recognized = context.reasoningTrace.recognizedData ?? {};
  for (const [key, value] of Object.entries(recognized)) {
    if (typeof value === 'string' || typeof value === 'number') {
      map[key] = value;
    } else if (Array.isArray(value)) {
      map[key] = value.join(', ');
    }
  }

  for (const [key, value] of Object.entries(context.resolvedReferences)) {
    if (typeof value === 'string' || typeof value === 'number') {
      map[key] = value;
    }
  }

  map.currentStep = context.session.currentStep;
  map.currentConcept = context.session.currentConcept ?? '';
  map.variable = String(recognized.variable ?? 'x');

  if (context.reasoningTrace.conclusion?.answerDisplay) {
    map.answerDisplay = String(context.reasoningTrace.conclusion.answerDisplay);
  }

  const intermediate = context.session.currentProblem?.intermediateResults ?? {};
  for (const [key, value] of Object.entries(intermediate)) {
    if (typeof value === 'string' || typeof value === 'number') {
      map[key] = value;
    }
  }

  return map;
}

/** Replace {{key}} placeholders; unknown keys become empty strings */
export function resolvePlaceholders(text: string, map: PlaceholderMap): string {
  return text.replace(PLACEHOLDER_PATTERN, (_, key: string) => {
    const value = map[key];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/** Returns placeholder keys still present after resolution */
export function findUnresolvedPlaceholders(text: string): string[] {
  const matches = text.matchAll(PLACEHOLDER_PATTERN);
  return [...matches].map((m) => m[1]);
}

/** True if any {{key}} remains in the string */
export function hasUnresolvedPlaceholders(text: string): boolean {
  PLACEHOLDER_PATTERN.lastIndex = 0;
  return PLACEHOLDER_PATTERN.test(text);
}
