/**
 * Deterministic intent detection engine.
 * Pipeline: session rules → subject detectors → base patterns → threshold.
 */

import { AgentIntent, IntentResult, INTENT_CONFIDENCE_THRESHOLD } from './intents';
import { IntentDetectionContext } from './types';
import { SORTED_INTENT_PATTERNS } from './intentPatterns';
import { SORTED_SESSION_RULES } from './sessionRules';
import { intentRegistry } from './intentRegistry';
import { createAgentContext } from '../core/agentContext';
import { TutorSessionData } from '../schemas/conversation.schema';

export class IntentEngine {
  detect(input: string, options?: IntentDetectionContext): IntentResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return { intent: 'UNKNOWN', confidence: 0, metadata: { reason: 'empty_input' } };
    }

    const ctx = this.buildContext(options);

    // 1. Session-aware rules (highest priority)
    const sessionResult = this.applySessionRules(trimmed, ctx);
    if (sessionResult && sessionResult.confidence >= INTENT_CONFIDENCE_THRESHOLD) {
      return sessionResult;
    }

    // 2. Subject-specific detectors
    const subjectResult = this.applySubjectDetectors(trimmed, ctx, options);
    if (subjectResult && subjectResult.confidence >= INTENT_CONFIDENCE_THRESHOLD) {
      return subjectResult;
    }

    // 3. Base pattern matching
    const patternResult = this.applyPatterns(trimmed, ctx);
    if (patternResult.confidence >= INTENT_CONFIDENCE_THRESHOLD) {
      return patternResult;
    }

    // 4. Below threshold — return best guess as UNKNOWN with metadata
    return {
      intent: 'UNKNOWN',
      confidence: patternResult.confidence,
      metadata: {
        bestCandidate: patternResult.intent,
        reason: 'below_threshold',
      },
    };
  }

  private buildContext(options?: IntentDetectionContext): IntentDetectionContext {
    const session = options?.session;
    return {
      ...options,
      hasActiveProblem:
        options?.hasActiveProblem ?? Boolean(session?.currentProblem?.rawInput),
      subject: options?.subject ?? session?.subject,
      topic: options?.topic ?? session?.topic,
    };
  }

  private applySessionRules(input: string, ctx: IntentDetectionContext): IntentResult | null {
    for (const rule of SORTED_SESSION_RULES) {
      if (rule.match(input, ctx)) {
        return rule.resolve(input, ctx);
      }
    }
    return null;
  }

  private applySubjectDetectors(
    input: string,
    ctx: IntentDetectionContext,
    options?: IntentDetectionContext
  ): IntentResult | null {
    const session = ctx.session ?? this.emptySession();
    const provisional = this.applyPatterns(input, ctx);
    const agentContext = createAgentContext(input, session, provisional);

    const detectors = [
      ...(options?.subjectDetectors ?? []),
      ...intentRegistry.asDetectionFns(ctx.subject),
    ];

    let best: IntentResult | null = null;

    for (const detector of detectors) {
      const result = detector(input, agentContext);
      if (result && (!best || result.confidence > best.confidence)) {
        best = result;
      }
    }

    return best;
  }

  private applyPatterns(input: string, ctx: IntentDetectionContext): IntentResult {
    let best: IntentResult = { intent: 'UNKNOWN', confidence: 0 };

    for (const rule of SORTED_INTENT_PATTERNS) {
      if (rule.requiresActiveProblem && !ctx.hasActiveProblem) continue;
      if (rule.requiresNoActiveProblem && ctx.hasActiveProblem) continue;

      const patternMatch = rule.patterns.some((p) => p.test(input));
      const keywordMatch = (rule.keywords ?? []).some((k) =>
        input.toLowerCase().includes(k.toLowerCase())
      );

      if (patternMatch || keywordMatch) {
        let confidence = patternMatch ? rule.baseConfidence : rule.baseConfidence * 0.85;

        // Session boost: ASK_WHY about coefficients when problem active
        if (
          rule.intent === 'ASK_WHY' &&
          ctx.hasActiveProblem &&
          /\b[abc]\b/i.test(input)
        ) {
          confidence = Math.min(confidence + 0.1, 0.98);
        }

        if (confidence > best.confidence) {
          best = {
            intent: rule.intent,
            confidence,
            metadata: { source: 'pattern', priority: rule.priority },
          };
        }
      }
    }

    return best;
  }

  private emptySession(): TutorSessionData {
    return {
      sessionId: '_intent_probe',
      currentStep: 0,
      completedSteps: [],
      teachingMode: 'GUIDED',
      difficulty: 'beginner',
      conversationHistory: [],
      metadata: {},
    } as TutorSessionData;
  }
}

export const intentEngine = new IntentEngine();

/** Convenience: detect with session directly */
export function detectIntent(
  input: string,
  session: TutorSessionData
): IntentResult {
  return intentEngine.detect(input, {
    session,
    hasActiveProblem: Boolean(session.currentProblem?.rawInput),
    subject: session.subject,
    topic: session.topic,
  });
}

export type { AgentIntent, IntentResult };
export { AGENT_INTENTS, INTENT_CONFIDENCE_THRESHOLD } from './intents';
