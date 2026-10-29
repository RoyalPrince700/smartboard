import { pickBestHypothesis } from './hypothesisScorer';
import { compactLooksComplete, compactMathTokens, formatMathTokens, tokenizeMathSpeech } from './mathTokenizer';
import {
  formatPersistentBuffer,
  isHypothesisBreak,
  isHypothesisBreakText,
  isMathRegression,
  isMathRegressionText,
  mergeIntoPersistentBuffer,
} from './persistentMathBuffer';
import {
  ConfirmedVoiceIntent,
  MathToken,
  RecognitionResultPayload,
  SolverState,
  VoiceDebugEvent,
  VoiceEngineState,
  VoiceIntent,
} from './types';
import { createVoiceDebugLog, formatVoiceDebugEvent } from './voiceDebugLog';
import { classifyVoiceIntent, isExecutableCommand } from './voiceIntentDetector';

interface OpenSegment {
  key: string;
  sessionId: number;
  resultIndex: number;
  generation: number;
  bestRaw: string;
  bestTokens: MathToken[];
  confidence: number;
  committed: boolean;
}

type CommitOrigin = 'final' | 'pause' | 'session-end' | 'break';

export interface VoiceEngineOptions {
  debug?: boolean;
  onBufferChange?: (equation: string) => void;
  onConfirmedIntent?: (intent: ConfirmedVoiceIntent) => void;
  onDebugEvent?: (event: VoiceDebugEvent) => void;
}

function emptyState(): VoiceEngineState {
  return {
    machine: 'IDLE',
    rawInterimTranscript: '',
    currentRecognitionSegment: '',
    currentRecognitionSessionId: 0,
    committedSpeechTokens: [],
    persistentMathBuffer: [],
    normalizedMathTokens: [],
    parsedEquation: '',
    detectedVoiceIntent: null,
    solverState: 'idle',
    displayEquation: '',
  };
}

function slotKey(sessionId: number, resultIndex: number): string {
  return `${sessionId}:${resultIndex}`;
}

function segmentKey(sessionId: number, resultIndex: number, generation: number): string {
  return `${sessionId}:${resultIndex}:${generation}`;
}

function solverFromBuffer(tokens: MathToken[]): SolverState {
  const compact = compactMathTokens(tokens);
  if (!compact) return 'idle';
  if (compactLooksComplete(compact)) return 'armed';
  return 'idle';
}

export function createVoiceInputEngine(options: VoiceEngineOptions = {}) {
  let state = emptyState();
  const segments = new Map<string, OpenSegment>();
  const slotGeneration = new Map<string, number>();
  const debugLog = createVoiceDebugLog();
  let lastExecutedCommandKey = '';
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const debug = (
    type: VoiceDebugEvent['type'],
    extra: Partial<VoiceDebugEvent> = {}
  ) => {
    const event = debugLog.push({
      type,
      sessionId: extra.sessionId ?? state.currentRecognitionSessionId,
      ...extra,
    });
    if (options.debug) {
      options.onDebugEvent?.(event);
      if (typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug(`[VoiceMath] ${formatVoiceDebugEvent(event)}`);
      }
    }
  };

  const syncDerived = () => {
    state.committedSpeechTokens = state.persistentMathBuffer;
    state.parsedEquation = formatPersistentBuffer(state.persistentMathBuffer);
    state.displayEquation = formatDisplay();
    if (state.solverState !== 'solving' && state.solverState !== 'solved') {
      state.solverState = solverFromBuffer(state.persistentMathBuffer);
    }
  };

  const lastLexeme = () => state.persistentMathBuffer[state.persistentMathBuffer.length - 1]?.value;
  const bufferHasEquals = () => state.persistentMathBuffer.some((token) => token.kind === 'equals');

  const formatDisplay = (): string => {
    let preview = state.persistentMathBuffer;
    const open = [...segments.values()]
      .filter((segment) => segment.sessionId === state.currentRecognitionSessionId && !segment.committed)
      .sort((a, b) => a.resultIndex - b.resultIndex);

    for (const segment of open) {
      const previous = preview[preview.length - 1]?.value;
      const hasEquals = preview.some((token) => token.kind === 'equals');
      const intent = classifyVoiceIntent(segment.bestRaw, {
        isFinal: false,
        confidence: segment.confidence,
        previousLexeme: previous,
        hasEquals,
      });
      if (intent.type === 'COMMAND_CANDIDATE' || (isExecutableCommand(intent.type) && !intent.mathText)) {
        continue;
      }
      const tokens = intent.mathText
        ? tokenizeMathSpeech(intent.mathText, previous, hasEquals)
        : segment.bestTokens;
      preview = mergeIntoPersistentBuffer(preview, tokens);
    }

    return formatMathTokens(preview);
  };

  const rememberBest = (segment: OpenSegment, raw: string, tokens: MathToken[], confidence: number) => {
    if (!segment.bestRaw) {
      segment.bestRaw = raw;
      segment.bestTokens = tokens;
      segment.confidence = confidence;
      return;
    }
    if (isMathRegression(segment.bestTokens, tokens) || isMathRegressionText(segment.bestRaw, raw)) {
      debug('REGRESSION_BLOCKED', {
        sessionId: segment.sessionId,
        resultIndex: segment.resultIndex,
        currentSegment: segment.bestRaw,
        rawResult: raw,
        persistentBufferBefore: formatMathTokens(segment.bestTokens),
        persistentBufferAfter: formatMathTokens(segment.bestTokens),
        detail: `kept "${segment.bestRaw}" over weaker "${raw}"`,
      });
      return;
    }
    const prevCompact = compactMathTokens(segment.bestTokens);
    const nextCompact = compactMathTokens(tokens);
    if (nextCompact.length < prevCompact.length && prevCompact.startsWith(nextCompact)) {
      return;
    }
    segment.bestRaw = raw;
    segment.bestTokens = tokens;
    segment.confidence = Math.max(segment.confidence, confidence);
  };

  const applyMathToBuffer = (tokens: MathToken[], raw: string, sessionId: number, resultIndex?: number) => {
    if (tokens.length === 0) return;
    const before = state.persistentMathBuffer;
    const beforeText = formatMathTokens(before);
    const after = mergeIntoPersistentBuffer(before, tokens);
    const afterText = formatMathTokens(after);

    if (afterText === beforeText) {
      debug('DUPLICATE_SKIPPED', {
        sessionId,
        resultIndex,
        rawResult: raw,
        persistentBufferBefore: beforeText,
        persistentBufferAfter: afterText,
      });
      return;
    }

    debug('PERSISTENT_BUFFER_BEFORE', {
      sessionId,
      resultIndex,
      persistentBufferBefore: beforeText,
      rawResult: raw,
    });

    state.persistentMathBuffer = after;
    state.normalizedMathTokens = tokens;
    syncDerived();

    debug('PERSISTENT_BUFFER_AFTER', {
      sessionId,
      resultIndex,
      persistentBufferAfter: state.parsedEquation,
      normalizedTokens: tokens.map((token) => token.value),
      parserResult: state.parsedEquation,
    });

    options.onBufferChange?.(state.parsedEquation);
  };

  const fireCommand = (intent: VoiceIntent, sessionId: number) => {
    if (!intent.confirmed || !isExecutableCommand(intent.type)) return;

    const key = `${intent.type}:${intent.matchedPhrase ?? ''}:${state.parsedEquation}`;
    if (key === lastExecutedCommandKey) {
      debug('DUPLICATE_SKIPPED', {
        sessionId,
        detectedIntent: intent.type,
        detail: 'command already executed',
      });
      return;
    }
    lastExecutedCommandKey = key;
    state.detectedVoiceIntent = intent;
    state.machine = intent.type === 'SOLVE_COMMAND' ? 'SOLVING' : 'COMMAND_CONFIRMED';
    if (intent.type === 'SOLVE_COMMAND') {
      state.solverState = 'solving';
    }

    debug('COMMAND_CONFIRMED', {
      sessionId,
      detectedIntent: intent.type,
      commandConfidence: intent.confidence,
      parserResult: state.parsedEquation,
      detail: intent.matchedPhrase,
    });

    options.onConfirmedIntent?.({
      type: intent.type,
      equation: state.parsedEquation,
      phrase: intent.matchedPhrase ?? '',
    });
  };

  const popLastToken = () => {
    if (state.persistentMathBuffer.length === 0) return;
    state.persistentMathBuffer = state.persistentMathBuffer.slice(0, -1);
    lastExecutedCommandKey = '';
    syncDerived();
    options.onBufferChange?.(state.parsedEquation);
  };

  const commitSegment = (segment: OpenSegment, origin: CommitOrigin) => {
    if (segment.committed) return;

    const treatAsFinal = origin === 'final' || origin === 'session-end';
    const intent = classifyVoiceIntent(segment.bestRaw, {
      isFinal: treatAsFinal,
      confidence: segment.confidence,
      previousLexeme: lastLexeme(),
      hasEquals: bufferHasEquals(),
    });
    state.detectedVoiceIntent = intent;

    const commandOnly =
      (isExecutableCommand(intent.type) && !intent.mathText) || intent.type === 'COMMAND_CANDIDATE';
    if (commandOnly && !treatAsFinal) {
      debug('COMMAND_CANDIDATE', {
        sessionId: segment.sessionId,
        resultIndex: segment.resultIndex,
        rawResult: segment.bestRaw,
        detail: `held ${origin} command until Chrome finalizes`,
      });
      syncDerived();
      return;
    }

    state.machine = 'COMMITTING_SPEECH';

    debug('SEGMENT_COMMIT', {
      sessionId: segment.sessionId,
      resultIndex: segment.resultIndex,
      currentSegment: segment.bestRaw,
      detectedIntent: intent.type,
      commandConfidence: intent.confidence,
      normalizedTokens: segment.bestTokens.map((token) => token.value),
      parserResult: intent.mathText ?? formatMathTokens(segment.bestTokens),
    });

    debug('DETECTED_INTENT', {
      sessionId: segment.sessionId,
      resultIndex: segment.resultIndex,
      detectedIntent: `${intent.type}${intent.confirmed ? ':confirmed' : ':unconfirmed'}`,
      commandConfidence: intent.confidence,
    });

    if (intent.type === 'COMMAND_CANDIDATE' || intent.prefixOnly) {
      debug('COMMAND_CANDIDATE', {
        sessionId: segment.sessionId,
        resultIndex: segment.resultIndex,
        rawResult: segment.bestRaw,
        detectedIntent: intent.type,
        detail: 'prefix or incomplete command — not executed, not added to buffer',
      });
      if (intent.mathText) {
        applyMathToBuffer(tokenizeMathSpeech(intent.mathText, lastLexeme(), bufferHasEquals()), intent.mathText, segment.sessionId, segment.resultIndex);
      }
      segment.committed = true;
      syncDerived();
      return;
    }

    const mathSource = intent.mathText ?? (intent.type === 'MATH_CONTENT' ? segment.bestRaw : '');
    if (mathSource) {
      const tokens = tokenizeMathSpeech(mathSource, lastLexeme(), bufferHasEquals());
      const preferred =
        isMathRegression(segment.bestTokens, tokens) && segment.bestTokens.length
          ? segment.bestTokens
          : tokens.length
            ? tokens
            : segment.bestTokens;
      applyMathToBuffer(preferred, mathSource, segment.sessionId, segment.resultIndex);
    } else if (intent.type === 'MATH_CONTENT' || segment.bestTokens.length > 0) {
      applyMathToBuffer(segment.bestTokens, segment.bestRaw, segment.sessionId, segment.resultIndex);
    }

    segment.committed = true;
    syncDerived();

    if (intent.confirmed) {
      fireCommand(intent, segment.sessionId);
    } else {
      state.machine = 'LISTENING';
    }
  };

  const getActiveSegment = (sessionId: number, resultIndex: number): OpenSegment => {
    const slot = slotKey(sessionId, resultIndex);
    const generation = slotGeneration.get(slot) ?? 0;
    slotGeneration.set(slot, generation);
    const key = segmentKey(sessionId, resultIndex, generation);
    const existing = segments.get(key);
    if (existing) return existing;
    const created: OpenSegment = {
      key,
      sessionId,
      resultIndex,
      generation,
      bestRaw: '',
      bestTokens: [],
      confidence: 0,
      committed: false,
    };
    segments.set(key, created);
    return created;
  };

  const advanceSegment = (sessionId: number, resultIndex: number): OpenSegment => {
    const slot = slotKey(sessionId, resultIndex);
    const generation = (slotGeneration.get(slot) ?? 0) + 1;
    slotGeneration.set(slot, generation);
    const created: OpenSegment = {
      key: segmentKey(sessionId, resultIndex, generation),
      sessionId,
      resultIndex,
      generation,
      bestRaw: '',
      bestTokens: [],
      confidence: 0,
      committed: false,
    };
    segments.set(created.key, created);
    return created;
  };

  const compactOf = (tokens: MathToken[]) => compactMathTokens(tokens);

  const incomingIsNewMath = (segment: OpenSegment, tokens: MathToken[], raw: string) => {
    if (!tokens.length && !raw.trim()) return false;
    if (!segment.bestRaw && !segment.bestTokens.length) return true;
    if (compactOf(segment.bestTokens) === compactOf(tokens) && segment.bestTokens.length > 0) return false;
    if (isMathRegression(segment.bestTokens, tokens)) return false;
    return true;
  };

  const api = {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getState(): VoiceEngineState {
      return {
        ...state,
        committedSpeechTokens: [...state.committedSpeechTokens],
        persistentMathBuffer: [...state.persistentMathBuffer],
        normalizedMathTokens: [...state.normalizedMathTokens],
        displayEquation: formatDisplay(),
      };
    },

    getDisplayEquation(): string {
      return formatDisplay();
    },

    getDebugEvents(): VoiceDebugEvent[] {
      return debugLog.snapshot();
    },

    startListening() {
      lastExecutedCommandKey = '';
      segments.clear();
      slotGeneration.clear();
      debugLog.clear();
      state = emptyState();
      state.machine = 'LISTENING';
      emit();
    },

    beginSession(sessionId: number) {
      state.currentRecognitionSessionId = sessionId;
      state.rawInterimTranscript = '';
      state.currentRecognitionSegment = '';
      state.machine = state.machine === 'PAUSED' || state.machine === 'RESTARTING' ? 'LISTENING' : state.machine;
      if (state.machine === 'IDLE') state.machine = 'LISTENING';
      debug('SESSION_START', { sessionId });
      debug('SESSION_ID', { sessionId, detail: String(sessionId) });
      emit();
    },

    handleResult(payload: RecognitionResultPayload) {
      if (payload.sessionId !== state.currentRecognitionSessionId) {
        debug('STALE_SESSION_DROPPED', {
          sessionId: payload.sessionId,
          detail: `current=${state.currentRecognitionSessionId}`,
          resultIndex: payload.resultIndex,
        });
        return;
      }

      const startIndex = Math.max(0, payload.resultIndex);
      let latestInterim = '';

      for (let i = startIndex; i < payload.results.length; i += 1) {
        const result = payload.results[i];
        const rawJoined = result.alternatives.map((alt) => alt.transcript).join(' | ');
        debug('RAW_RESULT', {
          sessionId: payload.sessionId,
          resultIndex: i,
          isFinal: result.isFinal,
          rawResult: rawJoined,
        });
        debug('RESULT_INDEX', { sessionId: payload.sessionId, resultIndex: i });
        debug('IS_FINAL', { sessionId: payload.sessionId, resultIndex: i, isFinal: result.isFinal });

        const picked = pickBestHypothesis(result.alternatives, state.persistentMathBuffer);
        const raw = picked?.transcript ?? result.alternatives[0]?.transcript ?? '';
        const confidence = picked?.confidence ?? result.alternatives[0]?.confidence ?? 0;
        const tokens = picked?.tokens ?? tokenizeMathSpeech(raw, lastLexeme(), bufferHasEquals());
        const newIntent = classifyVoiceIntent(raw, {
          isFinal: result.isFinal,
          confidence,
          previousLexeme: lastLexeme(),
          hasEquals: bufferHasEquals(),
        });
        let segment = getActiveSegment(payload.sessionId, i);

        const newIsCommand =
          (isExecutableCommand(newIntent.type) && !newIntent.mathText) || newIntent.type === 'COMMAND_CANDIDATE';
        const previousWasMath = segment.bestTokens.length > 0;
        const slotBreak =
          Boolean(segment.bestRaw) &&
          (isHypothesisBreak(segment.bestTokens, tokens) ||
            (newIsCommand && previousWasMath) ||
            isHypothesisBreakText(segment.bestRaw, raw));

        if (segment.committed) {
          if (!incomingIsNewMath(segment, tokens, raw) && !newIsCommand) {
            continue;
          }
          if (newIsCommand && !incomingIsNewMath(segment, tokens, raw) && compactOf(segment.bestTokens) === compactOf(tokens)) {
            continue;
          }
          segment = advanceSegment(payload.sessionId, i);
        } else if (slotBreak) {
          debug('HYPOTHESIS_BREAK', {
            sessionId: payload.sessionId,
            resultIndex: i,
            currentSegment: segment.bestRaw,
            rawResult: raw,
            persistentBufferBefore: state.parsedEquation,
            detail: `Chrome replaced "${segment.bestRaw}" with "${raw}" — locking previous token`,
          });
          commitSegment(segment, 'break');
          segment = advanceSegment(payload.sessionId, i);
        }

        rememberBest(segment, raw, tokens.length ? tokens : segment.bestTokens, confidence);
        state.currentRecognitionSegment = segment.bestRaw;
        state.normalizedMathTokens = segment.bestTokens;
        state.detectedVoiceIntent = classifyVoiceIntent(segment.bestRaw, {
          isFinal: result.isFinal,
          confidence,
          previousLexeme: lastLexeme(),
          hasEquals: bufferHasEquals(),
        });

        debug('NORMALIZED_TOKENS', {
          sessionId: payload.sessionId,
          resultIndex: i,
          normalizedTokens: segment.bestTokens.map((token) => token.value),
        });
        debug('CURRENT_SEGMENT', {
          sessionId: payload.sessionId,
          resultIndex: i,
          currentSegment: segment.bestRaw,
        });
        debug('DETECTED_INTENT', {
          sessionId: payload.sessionId,
          resultIndex: i,
          detectedIntent: `${state.detectedVoiceIntent.type}${state.detectedVoiceIntent.confirmed ? ':confirmed' : state.detectedVoiceIntent.prefixOnly ? ':prefix' : ':open'}`,
          commandConfidence: state.detectedVoiceIntent.confidence,
        });

        if (!result.isFinal) {
          latestInterim = segment.bestRaw;
          state.machine = 'RECEIVING_INTERIM';
          debug('INTERIM_TEXT', {
            sessionId: payload.sessionId,
            resultIndex: i,
            interimText: segment.bestRaw,
            isFinal: false,
          });
          continue;
        }

        debug('FINAL_TEXT', {
          sessionId: payload.sessionId,
          resultIndex: i,
          finalText: raw,
          currentSegment: segment.bestRaw,
          isFinal: true,
        });
        commitSegment(segment, 'final');
      }

      state.rawInterimTranscript = latestInterim;
      syncDerived();
      emit();
    },

    handleError(sessionId: number, error: string) {
      if (sessionId !== state.currentRecognitionSessionId) return;
      debug('RAW_RESULT', {
        sessionId,
        detail: `error=${error}`,
      });
      // Errors must not clear the math buffer.
      emit();
    },

    handleSpeechPause(sessionId: number) {
      if (sessionId !== state.currentRecognitionSessionId) return;
      const pending = [...segments.values()].filter(
        (segment) => segment.sessionId === sessionId && !segment.committed && segment.bestTokens.length > 0
      );
      debug('SPEECH_PAUSE', {
        sessionId,
        persistentBufferBefore: state.parsedEquation,
        detail: `committing ${pending.length} open math segment(s)`,
      });
      for (const segment of pending) {
        commitSegment(segment, 'pause');
      }
      state.rawInterimTranscript = '';
      syncDerived();
      emit();
    },

    handleSessionEnd(sessionId: number) {
      const pending = [...segments.values()].filter(
        (segment) => segment.sessionId === sessionId && !segment.committed
      );
      for (const segment of pending) {
        commitSegment(segment, 'session-end');
      }

      if (sessionId === state.currentRecognitionSessionId) {
        state.rawInterimTranscript = '';
        state.currentRecognitionSegment = '';
        state.machine = 'PAUSED';
      }

      debug('SESSION_END', {
        sessionId,
        persistentBufferAfter: state.parsedEquation,
        parserResult: state.parsedEquation,
      });
      syncDerived();
      emit();
    },

    markRestarting() {
      state.machine = 'RESTARTING';
      debug('RESTARTING', { sessionId: state.currentRecognitionSessionId });
      emit();
    },

    stopListening() {
      const current = state.currentRecognitionSessionId;
      if (current) {
        api.handleSessionEnd(current);
      }
      state.machine = 'IDLE';
      state.rawInterimTranscript = '';
      state.currentRecognitionSegment = '';
      emit();
    },

    undoLast() {
      popLastToken();
      emit();
    },

    clear() {
      lastExecutedCommandKey = '';
      segments.clear();
      slotGeneration.clear();
      debugLog.clear();
      const machine = state.machine === 'IDLE' ? 'IDLE' : 'LISTENING';
      state = emptyState();
      state.machine = machine;
      emit();
    },
  };

  return api;
}

export type VoiceInputEngine = ReturnType<typeof createVoiceInputEngine>;
