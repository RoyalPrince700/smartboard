/**
 * Tutor agent types — mirrors backend response contract.
 */

export type AgentResponseBlockType =
  | 'explanation'
  | 'formula'
  | 'calculation'
  | 'question'
  | 'hint'
  | 'answer'
  | 'verification'
  | 'example'
  | 'callout'
  | 'diagram';

export type AgentResponseStatus =
  | 'ok'
  | 'partial'
  | 'error'
  | 'unsupported'
  | 'not_implemented';

export type AgentNextAction =
  | 'await_input'
  | 'await_student_step'
  | 'await_answer'
  | 'await_verification'
  | 'await_problem'
  | 'session_complete';

export interface AgentResponseBlock {
  type: AgentResponseBlockType;
  title?: string;
  content?: string;
  expression?: string;
  latex?: string;
  label?: string;
  prompt?: string;
  value?: string;
  status?: 'correct' | 'incorrect' | 'partial';
  feedback?: string;
  expected?: string;
  received?: string;
  question?: string;
  variant?: 'tip' | 'warning' | 'misconception';
  spec?: Record<string, unknown>;
}

export interface TutorAgentResponse {
  sessionId: string;
  intent: string;
  subject?: string;
  topic?: string;
  status: AgentResponseStatus;
  blocks: AgentResponseBlock[];
  nextAction: AgentNextAction;
  meta?: {
    currentStep?: number;
    teachingMode?: string;
    difficulty?: string;
    problemType?: string;
  };
}

export interface AgentStatus {
  ready: boolean;
  enabled: boolean;
  subjects: string[];
  phase: string;
}

export interface AgentMessagePayload {
  message: string;
  sessionId?: string;
  boardId?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  teachingMode?: string;
}

export interface AgentSessionSummary {
  sessionId: string;
  subject?: string;
  topic?: string;
  currentStep: number;
  teachingMode?: string;
  difficulty?: string;
  hasActiveProblem: boolean;
  currentProblem?: {
    rawInput: string;
    problemType?: string;
    coefficients?: Record<string, number>;
  };
  turnCount: number;
}
