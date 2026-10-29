export type VoiceMachineState =
  | 'IDLE'
  | 'LISTENING'
  | 'RECEIVING_INTERIM'
  | 'COMMITTING_SPEECH'
  | 'PAUSED'
  | 'RESTARTING'
  | 'COMMAND_CONFIRMED'
  | 'SOLVING';

export type SolverState = 'idle' | 'armed' | 'solving' | 'solved';

export type MathTokenKind = 'term' | 'operator' | 'equals';

export interface MathToken {
  kind: MathTokenKind;
  value: string;
}

export type VoiceIntentType =
  | 'MATH_CONTENT'
  | 'SOLVE_COMMAND'
  | 'CLEAR_COMMAND'
  | 'UNDO_COMMAND'
  | 'REDO_COMMAND'
  | 'EXPLAIN_COMMAND'
  | 'READ_ALOUD_COMMAND'
  | 'STOP_COMMAND'
  | 'NEXT_STEP_COMMAND'
  | 'PREVIOUS_STEP_COMMAND'
  | 'CHECK_ANSWER_COMMAND'
  | 'COMMAND_CANDIDATE'
  | 'UNKNOWN';

export interface VoiceIntent {
  type: VoiceIntentType;
  confirmed: boolean;
  confidence: number;
  matchedPhrase?: string;
  /** Remaining spoken math after a trailing command is stripped. */
  mathText?: string;
  /** True when the utterance is only a prefix of a known command (so/sol/solv). */
  prefixOnly?: boolean;
}

export interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface RecognitionResultItem {
  isFinal: boolean;
  alternatives: RecognitionAlternative[];
}

export interface RecognitionResultPayload {
  sessionId: number;
  resultIndex: number;
  results: RecognitionResultItem[];
}

export interface ConfirmedVoiceIntent {
  type: VoiceIntentType;
  equation: string;
  phrase: string;
}

export interface VoiceEngineState {
  machine: VoiceMachineState;
  rawInterimTranscript: string;
  currentRecognitionSegment: string;
  currentRecognitionSessionId: number;
  committedSpeechTokens: MathToken[];
  persistentMathBuffer: MathToken[];
  normalizedMathTokens: MathToken[];
  parsedEquation: string;
  detectedVoiceIntent: VoiceIntent | null;
  solverState: SolverState;
  displayEquation: string;
}

export type VoiceDebugEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'SESSION_ID'
  | 'RAW_RESULT'
  | 'RESULT_INDEX'
  | 'IS_FINAL'
  | 'INTERIM_TEXT'
  | 'FINAL_TEXT'
  | 'NORMALIZED_TOKENS'
  | 'CURRENT_SEGMENT'
  | 'PERSISTENT_BUFFER_BEFORE'
  | 'PERSISTENT_BUFFER_AFTER'
  | 'DETECTED_INTENT'
  | 'COMMAND_CONFIDENCE'
  | 'PARSER_RESULT'
  | 'STALE_SESSION_DROPPED'
  | 'SEGMENT_COMMIT'
  | 'REGRESSION_BLOCKED'
  | 'DUPLICATE_SKIPPED'
  | 'COMMAND_CONFIRMED'
  | 'COMMAND_CANDIDATE'
  | 'RESTARTING'
  | 'HYPOTHESIS_BREAK'
  | 'SPEECH_PAUSE';

export interface VoiceDebugEvent {
  t: number;
  type: VoiceDebugEventType;
  sessionId: number;
  resultIndex?: number;
  isFinal?: boolean;
  rawResult?: string;
  interimText?: string;
  finalText?: string;
  normalizedTokens?: string[];
  currentSegment?: string;
  persistentBufferBefore?: string;
  persistentBufferAfter?: string;
  detectedIntent?: string;
  commandConfidence?: number;
  parserResult?: string;
  detail?: string;
}
