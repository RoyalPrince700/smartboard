import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ConfirmedVoiceIntent,
  RecognitionResultPayload,
  VoiceDebugEvent,
  VoiceEngineState,
  createVoiceInputEngine,
  isVoiceMathDebugEnabled,
} from '../voice';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function adaptRecognitionEvent(sessionId: number, event: SpeechRecognitionEvent): RecognitionResultPayload {
  const results = [];
  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    const alternatives = [];
    for (let j = 0; j < result.length; j += 1) {
      alternatives.push({
        transcript: result[j]?.transcript ?? '',
        confidence: result[j]?.confidence ?? 0,
      });
    }
    results.push({ isFinal: result.isFinal, alternatives });
  }
  return { sessionId, resultIndex: event.resultIndex, results };
}

export function useVoiceInput(options?: {
  mode?: 'math' | 'general';
  onFinalTranscript?: (text: string, fullHearingText?: string) => void;
  onConfirmedIntent?: (intent: ConfirmedVoiceIntent) => void;
  onBufferChange?: (equation: string) => void;
  lang?: string;
  continuous?: boolean;
}) {
  const mode = options?.mode ?? 'general';
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [engineState, setEngineState] = useState<VoiceEngineState | null>(null);
  const [debugEvents, setDebugEvents] = useState<VoiceDebugEvent[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepListeningRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef(0);
  const generalCommittedRef = useRef('');
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const debugEnabled = mode === 'math' && isVoiceMathDebugEnabled();

  const engine = useMemo(
    () =>
      createVoiceInputEngine({
        debug: debugEnabled,
        onBufferChange: (equation) => optionsRef.current?.onBufferChange?.(equation),
        onConfirmedIntent: (intent) => optionsRef.current?.onConfirmedIntent?.(intent),
      }),
    [debugEnabled]
  );

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (mode !== 'math') return undefined;
    const unsubscribe = engine.subscribe(() => {
      const next = engine.getState();
      setEngineState(next);
      setTranscript(next.displayEquation);
      setInterimTranscript('');
      setDebugEvents(engine.getDebugEvents());
    });
    return unsubscribe;
  }, [engine, mode]);

  const clearRestartTimer = () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const detachRecognition = (recognition: SpeechRecognition | null) => {
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onspeechend = null;
    recognition.onaudioend = null;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };

  const beginRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !keepListeningRef.current) return;

    clearRestartTimer();

    const mathMode = mode === 'math';
    const reuseExisting = mathMode && recognitionRef.current;

    if (!reuseExisting) {
      if (recognitionRef.current) {
        detachRecognition(recognitionRef.current);
        recognitionRef.current = null;
      }

      const recognition = new Ctor();
      recognition.lang = optionsRef.current?.lang ?? 'en-US';
      recognition.continuous = mathMode ? true : Boolean(optionsRef.current?.continuous);
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognitionRef.current = recognition;
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;
    if (mathMode) {
      engine.beginSession(sessionId);
    }

    recognition.onstart = () => {
      setIsListening(true);
      if (!mathMode) {
        setInterimTranscript('');
      }
    };

    recognition.onspeechend = () => {
      if (mathMode) {
        engine.handleSpeechPause(sessionIdRef.current);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (mathMode) {
        engine.handleResult(adaptRecognitionEvent(sessionIdRef.current, event));
        return;
      }

      let finals = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finals = finals ? `${finals} ${text}` : text;
        } else {
          interim = interim ? `${interim} ${text}` : text;
        }
      }
      if (finals.trim()) {
        generalCommittedRef.current = [generalCommittedRef.current, finals.trim()].filter(Boolean).join(' ');
        setTranscript(generalCommittedRef.current);
        optionsRef.current?.onFinalTranscript?.(finals.trim(), generalCommittedRef.current);
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (mathMode) {
        engine.handleError(sessionIdRef.current, event.error);
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        keepListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (mathMode) {
        engine.handleSessionEnd(sessionIdRef.current);
      }

      const shouldRestart =
        keepListeningRef.current && (mathMode || Boolean(optionsRef.current?.continuous));
      if (!shouldRestart) {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
        setIsListening(false);
        return;
      }

      if (mathMode) engine.markRestarting();
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (!keepListeningRef.current) return;
        beginRecognition();
      }, 0);
    };

    try {
      recognition.start();
    } catch {
      if (keepListeningRef.current) {
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          beginRecognition();
        }, 80);
      }
    }
  }, [engine, mode]);

  const stopListening = useCallback(() => {
    keepListeningRef.current = false;
    clearRestartTimer();
    if (mode === 'math') {
      engine.stopListening();
      const next = engine.getState();
      setEngineState(next);
      setTranscript(next.displayEquation);
      setInterimTranscript('');
    }
    detachRecognition(recognitionRef.current);
    recognitionRef.current = null;
    setIsListening(false);
  }, [engine, mode]);

  const startListening = useCallback(() => {
    if (!getSpeechRecognitionCtor()) return;
    keepListeningRef.current = true;
    sessionIdRef.current = 0;
    generalCommittedRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    if (mode === 'math') {
      engine.startListening();
      setEngineState(engine.getState());
      setDebugEvents(engine.getDebugEvents());
    }
    beginRecognition();
  }, [beginRecognition, engine, mode]);

  const clearHearing = useCallback(() => {
    generalCommittedRef.current = '';
    if (mode === 'math') {
      engine.clear();
      setEngineState(engine.getState());
      setDebugEvents(engine.getDebugEvents());
    }
    setTranscript('');
    setInterimTranscript('');
  }, [engine, mode]);

  const getFullHearing = useCallback(() => {
    if (mode === 'math') {
      return engine.getDisplayEquation() || engine.getState().parsedEquation;
    }
    return [generalCommittedRef.current, interimTranscript].filter(Boolean).join(' ').trim();
  }, [engine, interimTranscript, mode]);

  const undoLast = useCallback(() => {
    if (mode !== 'math') return;
    engine.undoLast();
  }, [engine, mode]);

  const toggleListening = useCallback(() => {
    if (isListening || keepListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  const hearingText = mode === 'math' ? engineState?.displayEquation || transcript : transcript;

  return {
    supported,
    isListening,
    transcript: hearingText,
    interimTranscript: mode === 'math' ? '' : interimTranscript,
    hearingText,
    parsedEquation: engineState?.parsedEquation ?? hearingText,
    machineState: engineState?.machine ?? (isListening ? 'LISTENING' : 'IDLE'),
    debugEvents,
    debugEnabled,
    startListening,
    stopListening,
    toggleListening,
    clearHearing,
    getFullHearing,
    undoLast,
  };
}
