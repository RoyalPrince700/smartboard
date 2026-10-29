/**
 * TutorSession lifecycle configuration.
 */

/** Default session TTL — 24 hours of inactivity */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** How often to run expired-session cleanup (documented for cron/job use) */
export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Max conversation turns retained in session history */
export const MAX_CONVERSATION_TURNS = 50;

/** Recent turns included in context summaries */
export const CONTEXT_HISTORY_WINDOW = 6;

export function computeExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_MS);
}

export function isSessionExpired(session: { expiresAt?: Date }): boolean {
  if (!session.expiresAt) return false;
  return new Date(session.expiresAt) <= new Date();
}
