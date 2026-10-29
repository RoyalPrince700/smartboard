/**
 * TutorSession schema — conversation state persisted in MongoDB (agentSessions).
 */

import { Schema, model, Document } from 'mongoose';
import { AgentIntent } from '../core/intentEngine';
import { TeachingMode } from '../core/teachingEngine';
import { DifficultyLevel } from '../types';

export interface ConversationTurn {
  role: 'student' | 'tutor';
  content: string;
  intent?: AgentIntent;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ProblemState {
  rawInput: string;
  normalizedInput?: string;
  problemType?: string;
  coefficients?: Record<string, number>;
  selectedMethod?: string;
  intermediateResults?: Record<string, unknown>;
}

export interface CompletedStep {
  step: number;
  title: string;
  completedAt: Date;
}

export interface ITutorSession extends Document {
  sessionId: string;
  userId?: string;
  boardId?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  currentProblem?: ProblemState;
  currentStep: number;
  completedSteps: CompletedStep[];
  currentConcept?: string;
  teachingMode: TeachingMode;
  difficulty: DifficultyLevel;
  conversationHistory: ConversationTurn[];
  lastTutorAction?: string;
  lastStudentAction?: string;
  unresolvedQuestion?: string;
  metadata: Record<string, unknown>;
  expiresAt?: Date;
}

const ConversationTurnSchema = new Schema<ConversationTurn>(
  {
    role: { type: String, enum: ['student', 'tutor'], required: true },
    content: { type: String, required: true },
    intent: String,
    timestamp: { type: Date, default: Date.now },
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

const ProblemStateSchema = new Schema<ProblemState>(
  {
    rawInput: String,
    normalizedInput: String,
    problemType: String,
    coefficients: Schema.Types.Mixed,
    selectedMethod: String,
    intermediateResults: Schema.Types.Mixed,
  },
  { _id: false }
);

const CompletedStepSchema = new Schema<CompletedStep>(
  {
    step: Number,
    title: String,
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TutorSessionSchema = new Schema<ITutorSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    boardId: String,
    subject: String,
    topic: String,
    subtopic: String,
    currentProblem: ProblemStateSchema,
    currentStep: { type: Number, default: 0 },
    completedSteps: { type: [CompletedStepSchema], default: [] },
    currentConcept: String,
    teachingMode: {
      type: String,
      enum: ['DIRECT', 'GUIDED', 'SOCRATIC', 'HINT', 'EXAM', 'PRACTICE'],
      default: 'GUIDED',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    conversationHistory: { type: [ConversationTurnSchema], default: [] },
    lastTutorAction: String,
    lastStudentAction: String,
    unresolvedQuestion: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true, collection: 'agentSessions' }
);

TutorSessionSchema.index({ userId: 1, updatedAt: -1 });

export const TutorSession = model<ITutorSession>('TutorSession', TutorSessionSchema);

/** Plain object representation for in-memory use */
export type TutorSessionData = Omit<ITutorSession, keyof Document> & {
  _id?: unknown;
};

export function createEmptySession(
  sessionId: string,
  userId?: string,
  boardId?: string
): TutorSessionData {
  return {
    sessionId,
    userId,
    boardId,
    currentStep: 0,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  } as TutorSessionData;
}
