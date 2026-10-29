/**
 * Determines TutorResponse status from agent context.
 */

import { AgentContext } from '../core/agentContext';
import { ResponseStatus } from './responseTypes';

const ERROR_FLAGS = new Set([
  'parse_failed',
  'solve_failed',
  'no_solver_available',
  'topic_not_registered',
]);

const UNSUPPORTED_FLAGS = new Set(['missing_subject_or_topic', 'unsupported_topic']);

export function resolveResponseStatus(context: AgentContext): ResponseStatus {
  const flags = context.reasoningTrace.flags ?? [];

  if (flags.some((f) => UNSUPPORTED_FLAGS.has(f))) return 'unsupported';
  if (flags.some((f) => ERROR_FLAGS.has(f))) return 'error';
  if (flags.includes('not_implemented')) return 'not_implemented';

  const intent = context.intent.intent;
  if (intent === 'UNKNOWN' && !context.subject) return 'partial';

  return 'ok';
}
