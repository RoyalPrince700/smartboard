/**
 * Verifies student answers against reasoning conclusion.
 */

import { AgentContext } from '../core/agentContext';
import { ReasoningTrace, VerificationResult } from '../schemas/reasoning.schema';

const ROOT_PATTERN =
  /x\s*=\s*([-+]?\d+(?:\.\d+)?)|(?:^|[,\s]|or\s)([-+]?\d+(?:\.\d+)?)(?:\s*$|[,\s]|or\b)/gi;

export class Verifier {
  verifyAnswer(context: AgentContext, trace: ReasoningTrace): VerificationResult {
    const expected = this.extractExpectedRoots(trace);
    const received = parseSubmittedRoots(context.rawInput);

    if (expected.length === 0) {
      return {
        status: 'unverified',
        received: context.rawInput,
        feedback: 'No expected answer available to verify against.',
      };
    }

    if (received.length === 0) {
      return {
        status: 'unverified',
        expected: expected.join(', '),
        received: context.rawInput,
        feedback: 'Could not parse roots from your answer. Try format: x = -3 or x = 0.5',
      };
    }

    const match = this.rootsMatch(expected, received);

    return {
      status: match ? 'correct' : 'incorrect',
      expected: expected.map((r) => `x = ${r}`).join(' or '),
      received: received.map((r) => `x = ${r}`).join(' or '),
      feedback: match
        ? 'Your answer matches the expected roots.'
        : 'Your answer does not match the expected roots.',
    };
  }

  private extractExpectedRoots(trace: ReasoningTrace): number[] {
    const fromConclusion = trace.conclusion?.answer;
    if (Array.isArray(fromConclusion)) {
      return fromConclusion.map(Number).filter((n) => !Number.isNaN(n));
    }
    const fromData = trace.recognizedData?.roots;
    if (Array.isArray(fromData)) {
      return fromData.map(Number).filter((n) => !Number.isNaN(n));
    }
    return [];
  }

  private rootsMatch(expected: number[], received: number[]): boolean {
    if (expected.length !== received.length) return false;
    const sortedExpected = [...expected].sort((a, b) => a - b);
    const sortedReceived = [...received].sort((a, b) => a - b);
    return sortedExpected.every((v, i) => Math.abs(v - sortedReceived[i]) < 1e-6);
  }
}

/** Parse numeric roots from student submission */
export function parseSubmittedRoots(input: string): number[] {
  const roots: number[] = [];
  let match: RegExpExecArray | null;

  const pattern = new RegExp(ROOT_PATTERN.source, ROOT_PATTERN.flags);
  while ((match = pattern.exec(input)) !== null) {
    const val = match[1] ?? match[2];
    if (val !== undefined) {
      const n = parseFloat(val);
      if (!Number.isNaN(n)) roots.push(n);
    }
  }

  return [...new Set(roots)];
}

export const verifier = new Verifier();
