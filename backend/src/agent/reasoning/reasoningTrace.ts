/**
 * Builds and merges reasoning trace records.
 */

import {
  ReasoningTrace,
  ReasoningStep,
  appendReasoningStep,
} from '../schemas/reasoning.schema';

export class ReasoningTraceBuilder {
  merge(base: ReasoningTrace, partial: Partial<ReasoningTrace>): ReasoningTrace {
    const mergedSteps = [...base.reasoningSteps, ...(partial.reasoningSteps ?? [])];
    // Re-order step numbers sequentially
    const reasoningSteps = mergedSteps.map((s, i) => ({ ...s, order: i + 1 }));

    return {
      ...base,
      problemType: partial.problemType ?? base.problemType,
      recognizedData: { ...base.recognizedData, ...partial.recognizedData },
      selectedMethod: partial.selectedMethod ?? base.selectedMethod,
      selectedStrategy: partial.selectedStrategy ?? base.selectedStrategy,
      reasoningSteps,
      conclusion: partial.conclusion ?? base.conclusion,
      flags: [...(base.flags ?? []), ...(partial.flags ?? [])],
      appliedRules: [...(base.appliedRules ?? []), ...(partial.appliedRules ?? [])],
    };
  }

  recordRules(trace: ReasoningTrace, appliedRules: string[]): ReasoningTrace {
    return {
      ...trace,
      appliedRules: [...(trace.appliedRules ?? []), ...appliedRules],
      reasoningSteps: [
        ...trace.reasoningSteps,
        ...appliedRules.map((ruleId, i) => ({
          order: trace.reasoningSteps.length + i + 1,
          action: 'apply_rule',
          description: `Applied rule: ${ruleId}`,
          data: { ruleId },
        })),
      ],
    };
  }

  buildConclusion(recognizedData: Record<string, unknown>): Record<string, unknown> {
    const conclusion: Record<string, unknown> = {};

    if (recognizedData.roots !== undefined) {
      conclusion.answer = recognizedData.roots;
      conclusion.answerDisplay = formatRoots(recognizedData.roots);
    }
    if (recognizedData.answerDisplay !== undefined) {
      conclusion.answer = recognizedData.answer ?? recognizedData.answerDisplay;
      conclusion.answerDisplay = recognizedData.answerDisplay;
    } else if (recognizedData.answer !== undefined && conclusion.answerDisplay === undefined) {
      conclusion.answer = recognizedData.answer;
      conclusion.answerDisplay = String(recognizedData.answer);
    }
    if (recognizedData.rootCount !== undefined) conclusion.rootCount = recognizedData.rootCount;
    if (recognizedData.rootType !== undefined) conclusion.rootType = recognizedData.rootType;
    if (recognizedData.discriminant !== undefined) {
      conclusion.discriminant = recognizedData.discriminant;
    }
    if (recognizedData.area !== undefined) conclusion.area = recognizedData.area;
    if (recognizedData.perimeter !== undefined) conclusion.perimeter = recognizedData.perimeter;
    if (recognizedData.hypotenuse !== undefined) conclusion.hypotenuse = recognizedData.hypotenuse;
    if (recognizedData.shapeType !== undefined) conclusion.shapeType = recognizedData.shapeType;

    return conclusion;
  }

  finalize(trace: ReasoningTrace): ReasoningTrace {
    const recognizedData = trace.recognizedData ?? {};
    const conclusion = this.buildConclusion(recognizedData);

    return {
      ...trace,
      conclusion: Object.keys(conclusion).length > 0 ? conclusion : trace.conclusion,
    };
  }
}

function formatRoots(roots: unknown): string {
  if (!Array.isArray(roots)) return String(roots);
  return roots.map((r) => `x = ${r}`).join(' or ');
}

export const reasoningTraceBuilder = new ReasoningTraceBuilder();

export { appendReasoningStep };
