/**
 * Reasoning trace types — internal record of agent reasoning (not shown directly to students).
 */

export interface ReasoningStep {
  order: number;
  action: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface VerificationResult {
  status: 'correct' | 'incorrect' | 'partial' | 'unverified';
  expected?: unknown;
  received?: unknown;
  feedback?: string;
}

export interface ReasoningTrace {
  problemType?: string;
  recognizedData?: Record<string, unknown>;
  selectedMethod?: string;
  selectedStrategy?: string;
  appliedRules?: string[];
  reasoningSteps: ReasoningStep[];
  verification?: VerificationResult;
  conclusion?: Record<string, unknown>;
  flags?: string[];
}

export function createEmptyTrace(): ReasoningTrace {
  return {
    reasoningSteps: [],
    flags: [],
  };
}

export function appendReasoningStep(
  trace: ReasoningTrace,
  action: string,
  description: string,
  data?: Record<string, unknown>
): ReasoningTrace {
  return {
    ...trace,
    reasoningSteps: [
      ...trace.reasoningSteps,
      {
        order: trace.reasoningSteps.length + 1,
        action,
        description,
        data,
      },
    ],
  };
}
