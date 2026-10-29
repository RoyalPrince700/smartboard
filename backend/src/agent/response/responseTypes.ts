/**
 * Response block types — contract between agent and React frontend.
 */

export const RESPONSE_BLOCK_TYPES = [
  'explanation',
  'formula',
  'calculation',
  'question',
  'hint',
  'answer',
  'verification',
  'example',
  'callout',
  'diagram',
] as const;

export type ResponseBlockType = (typeof RESPONSE_BLOCK_TYPES)[number];

export type ResponseStatus = 'ok' | 'partial' | 'error' | 'unsupported' | 'not_implemented';

export type NextAction =
  | 'await_input'
  | 'await_student_step'
  | 'await_answer'
  | 'await_verification'
  | 'await_problem'
  | 'session_complete';

interface BlockBase {
  type: ResponseBlockType;
  title?: string;
}

export interface ExplanationBlock extends BlockBase {
  type: 'explanation';
  content: string;
}

export interface FormulaBlock extends BlockBase {
  type: 'formula';
  expression: string;
  latex?: string;
}

export interface CalculationBlock extends BlockBase {
  type: 'calculation';
  expression: string;
  latex?: string;
  label?: string;
  steps?: string[];
}

export interface QuestionBlock extends BlockBase {
  type: 'question';
  prompt: string;
  expectedFormat?: string;
}

export interface HintBlock extends BlockBase {
  type: 'hint';
  content: string;
  level?: number;
}

export interface AnswerBlock extends BlockBase {
  type: 'answer';
  value: string;
  latex?: string;
}

export interface VerificationBlock extends BlockBase {
  type: 'verification';
  status: 'correct' | 'incorrect' | 'partial';
  feedback?: string;
  expected?: string;
  received?: string;
}

export interface ExampleBlock extends BlockBase {
  type: 'example';
  question: string;
  content?: string;
}

export interface CalloutBlock extends BlockBase {
  type: 'callout';
  content: string;
  variant?: 'tip' | 'warning' | 'misconception';
}

export interface DiagramBlock extends BlockBase {
  type: 'diagram';
  spec: Record<string, unknown>;
}

export type ResponseBlock =
  | ExplanationBlock
  | FormulaBlock
  | CalculationBlock
  | QuestionBlock
  | HintBlock
  | AnswerBlock
  | VerificationBlock
  | ExampleBlock
  | CalloutBlock
  | DiagramBlock;
