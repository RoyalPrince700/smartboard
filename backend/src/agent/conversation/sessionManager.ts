/**
 * TutorSession persistence — uses Mongoose model from conversation.schema.ts.
 */

import {
  TutorSession,
  TutorSessionData,
  createEmptySession,
} from '../schemas/conversation.schema';
import { computeExpiresAt, isSessionExpired } from './sessionConfig';

export interface SessionLoadOptions {
  userId?: string;
  boardId?: string;
  subject?: string;
  topic?: string;
  difficulty?: TutorSessionData['difficulty'];
  teachingMode?: TutorSessionData['teachingMode'];
}

export class SessionManager {
  /**
   * Load an existing session or create a new one.
   * Expired sessions are deleted and recreated.
   */
  async loadOrCreate(sessionId: string, options?: SessionLoadOptions): Promise<TutorSessionData> {
    const existing = await this.load(sessionId);

    if (existing) {
      if (isSessionExpired(existing)) {
        await this.delete(sessionId);
      } else {
        return this.applyOptions(existing, options);
      }
    }

    const data = createEmptySession(sessionId, options?.userId, options?.boardId);
    const created = await TutorSession.create(data);
    const session = created.toObject() as TutorSessionData;
    return this.applyOptions(session, options);
  }

  async load(sessionId: string): Promise<TutorSessionData | null> {
    const doc = await TutorSession.findOne({ sessionId }).lean();
    if (!doc) return null;
    return doc as unknown as TutorSessionData;
  }

  async loadByBoardId(boardId: string): Promise<TutorSessionData | null> {
    const doc = await TutorSession.findOne({ boardId, expiresAt: { $gt: new Date() } })
      .sort({ updatedAt: -1 })
      .lean();
    if (!doc) return null;
    return doc as unknown as TutorSessionData;
  }

  async save(session: TutorSessionData): Promise<void> {
    const expiresAt = computeExpiresAt();

    await TutorSession.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          ...session,
          expiresAt,
        },
      },
      { upsert: true, new: true }
    );
  }

  async delete(sessionId: string): Promise<void> {
    await TutorSession.deleteOne({ sessionId });
  }

  /** Mark session expired immediately */
  async expire(sessionId: string): Promise<void> {
    await TutorSession.updateOne({ sessionId }, { $set: { expiresAt: new Date() } });
  }

  /** Remove all expired sessions — call from a scheduled job */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await TutorSession.deleteMany({ expiresAt: { $lte: new Date() } });
    return result.deletedCount ?? 0;
  }

  /** Extend TTL without other changes */
  async touch(sessionId: string): Promise<void> {
    await TutorSession.updateOne({ sessionId }, { $set: { expiresAt: computeExpiresAt() } });
  }

  private applyOptions(
    session: TutorSessionData,
    options?: SessionLoadOptions
  ): TutorSessionData {
    if (!options) return session;

    if (options.boardId) session.boardId = options.boardId;
    if (options.userId) session.userId = options.userId;
    if (options.subject) session.subject = options.subject;
    if (options.topic) session.topic = options.topic;
    if (options.difficulty) session.difficulty = options.difficulty;
    if (options.teachingMode) session.teachingMode = options.teachingMode;

    return session;
  }
}

export const sessionManager = new SessionManager();
