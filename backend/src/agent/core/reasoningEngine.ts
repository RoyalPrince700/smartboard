/**
 * General reasoning pipeline orchestrator.
 * Delegates to subject/topic solvers via registry — no topic-specific logic here.
 */

import { AgentContext } from './agentContext';
import { ReasoningTrace, appendReasoningStep, createEmptyTrace } from '../schemas/reasoning.schema';
import { subjectRegistry } from '../subjects/registry';
import { topicRegistry } from '../subjects/topicRegistry';
import { ruleEngine } from '../reasoning/ruleEngine';
import { strategySelector } from '../reasoning/strategySelector';
import { reasoningTraceBuilder } from '../reasoning/reasoningTrace';
import { verifier } from '../reasoning/verifier';
import { normalizeReasoningInput, buildInputHints } from '../reasoning/normalizer';

export type PipelineStage =
  | 'normalize'
  | 'identify_subject'
  | 'identify_topic'
  | 'execute_solver'
  | 'apply_rules'
  | 'select_strategy'
  | 'build_conclusion'
  | 'verify'
  | 'complete';

export class ReasoningEngine {
  /**
   * Run the full reasoning pipeline.
   *
   * normalize → identify subject/topic → solver (parse) → rules → strategy → conclude → verify
   */
  async run(context: AgentContext): Promise<ReasoningTrace> {
    let trace = createEmptyTrace();

    // ── 1. Normalize ──────────────────────────────────────────────────────────
    context.pipelineStage = 'normalize';
    const { normalized } = normalizeReasoningInput(context.rawInput);
    context.normalizedInput = normalized;
    trace = appendReasoningStep(trace, 'normalize', `Normalized input: "${normalized}"`);

    const isNewProblem = context.intent.intent === 'START_PROBLEM';

    // ── 2. Identify subject ───────────────────────────────────────────────────
    context.pipelineStage = 'identify_subject';
    context.subject = context.subject ?? this.inferSubject(context, isNewProblem);
    trace = appendReasoningStep(trace, 'identify_subject', `Subject: ${context.subject ?? 'unknown'}`);

    // ── 3. Identify topic ─────────────────────────────────────────────────────
    context.pipelineStage = 'identify_topic';
    if (isNewProblem) {
      // Re-classify from the new equation — do not reuse a stale session topic.
      context.topic = undefined;
    }
    context.topic = context.topic ?? this.inferTopic(context, isNewProblem);
    trace = appendReasoningStep(trace, 'identify_topic', `Topic: ${context.topic ?? 'unknown'}`);

    if (!context.subject || !context.topic) {
      trace.flags = [...(trace.flags ?? []), 'missing_subject_or_topic'];
      context.reasoningTrace = trace;
      return trace;
    }

    const topicReg = subjectRegistry.getTopic(context.subject, context.topic);
    if (!topicReg) {
      trace.flags = [...(trace.flags ?? []), 'topic_not_registered'];
      context.reasoningTrace = trace;
      return trace;
    }

    // Seed recognizedData with input hints
    trace.recognizedData = {
      ...buildInputHints(normalized),
      ...(trace.recognizedData ?? {}),
    };

    // ── 4. Execute solver (parse + compute) ───────────────────────────────────
    context.pipelineStage = 'execute_solver';
    const defaultSolver = topicReg.solvers.default;
    if (defaultSolver) {
      const solverResult = await Promise.resolve(defaultSolver(context));
      trace = reasoningTraceBuilder.merge(trace, solverResult);
    } else {
      trace.flags = [...(trace.flags ?? []), 'no_solver_available'];
    }

    // ── 5. Apply rules ────────────────────────────────────────────────────────
    context.pipelineStage = 'apply_rules';
    const ruleContext = { ...(trace.recognizedData ?? {}) };
    const { context: updatedContext, appliedRules } = ruleEngine.evaluate(topicReg.rules, ruleContext);
    trace.recognizedData = updatedContext;
    trace.appliedRules = appliedRules;

    for (const ruleId of appliedRules) {
      const rule = topicReg.rules.find((r) => r.ruleId === ruleId);
      trace = appendReasoningStep(trace, 'apply_rule', rule?.description ?? ruleId, { ruleId });
    }

    // ── 6. Select strategy ────────────────────────────────────────────────────
    context.pipelineStage = 'select_strategy';
    const selection = strategySelector.select(topicReg.strategies, trace.recognizedData ?? {});

    if (selection) {
      trace.selectedMethod = selection.method;
      trace.selectedStrategy = selection.strategy.strategyId;
      trace = appendReasoningStep(trace, 'select_strategy', selection.strategy.description, {
        method: selection.method,
        strategyId: selection.strategy.strategyId,
        usedFallback: selection.usedFallback,
        fallback: selection.strategy.fallback,
      });

      // Run method-specific solver if registered and different from default
      const methodSolver = topicReg.solvers[selection.method];
      if (methodSolver && selection.method !== 'default') {
        const methodResult = await Promise.resolve(methodSolver(context));
        trace = reasoningTraceBuilder.merge(trace, methodResult);
      }
    }

    // ── 7. Build conclusion ───────────────────────────────────────────────────
    context.pipelineStage = 'build_conclusion';
    trace = reasoningTraceBuilder.finalize(trace);
    if (trace.conclusion && Object.keys(trace.conclusion).length > 0) {
      trace = appendReasoningStep(trace, 'conclude', 'Reasoning complete', trace.conclusion);
    }

    // ── 8. Verify (answer-check intents only) ─────────────────────────────────
    context.pipelineStage = 'verify';
    if (context.intent.intent === 'SUBMIT_ANSWER' || context.intent.intent === 'CHECK_ANSWER') {
      // Use roots from active session if solver did not produce them (e.g. answer-only input)
      const sessionRoots = context.session.currentProblem?.intermediateResults?.roots;
      if (sessionRoots && !trace.recognizedData?.roots) {
        trace.recognizedData = { ...trace.recognizedData, roots: sessionRoots };
        trace = reasoningTraceBuilder.finalize(trace);
      }

      trace.verification = verifier.verifyAnswer(context, trace);
      trace = appendReasoningStep(trace, 'verify', `Verification: ${trace.verification.status}`, {
        status: trace.verification.status,
      });
    }

    context.pipelineStage = 'complete';
    context.reasoningTrace = trace;
    return trace;
  }

  private inferSubject(context: AgentContext, fromInputOnly = false): string | undefined {
    if (!fromInputOnly && context.session.subject) return context.session.subject;

    for (const subject of subjectRegistry.getAll()) {
      for (const topic of subject.topics) {
        if (topic.topicClassifier?.(context.normalizedInput, context)?.matches) {
          return subject.id;
        }
      }
    }
    return undefined;
  }

  private inferTopic(context: AgentContext, fromInputOnly = false): string | undefined {
    if (!fromInputOnly && context.session.topic) return context.session.topic;

    const resolved = topicRegistry.resolveTopicFromInput(context.normalizedInput, context);
    if (resolved) {
      context.subject = context.subject ?? resolved.subjectId;
      return resolved.topicId;
    }

    const subject = context.subject;
    if (!subject) return undefined;

    const reg = subjectRegistry.get(subject);
    if (!reg) return undefined;

    for (const topic of reg.topics) {
      const result = topic.topicClassifier?.(context.normalizedInput, context);
      if (result?.matches) return topic.id;
    }
    return undefined;
  }
}

export const reasoningEngine = new ReasoningEngine();
