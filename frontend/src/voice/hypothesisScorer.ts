import { compactMathTokens, isValidTokenSequence, tokenizeMathSpeech } from './mathTokenizer';
import { isMathRegression, isPlausibleContinuation, mergeIntoPersistentBuffer } from './persistentMathBuffer';
import { MathToken, RecognitionAlternative } from './types';
import { classifyVoiceIntent } from './voiceIntentDetector';

export interface ScoredHypothesis {
  transcript: string;
  confidence: number;
  score: number;
  tokens: MathToken[];
}

function isPlausibleContinuationScore(buffer: MathToken[], incoming: MathToken[]): boolean {
  return isPlausibleContinuation(buffer, incoming);
}

export function scoreMathHypothesis(
  text: string,
  buffer: MathToken[],
  confidence: number
): ScoredHypothesis {
  const previous = buffer[buffer.length - 1]?.value;
  const hasEquals = buffer.some((token) => token.kind === 'equals');
  const intent = classifyVoiceIntent(text, { isFinal: false, confidence, previousLexeme: previous, hasEquals });
  const mathSource = intent.mathText ?? (intent.type === 'MATH_CONTENT' ? text : '');
  const tokens = mathSource ? tokenizeMathSpeech(mathSource, previous, hasEquals) : [];
  const merged = mergeIntoPersistentBuffer(buffer, tokens);
  const bufC = compactMathTokens(buffer);
  const merC = compactMathTokens(merged);
  const tokC = compactMathTokens(tokens);

  let score = 0;

  if (intent.type === 'COMMAND_CANDIDATE' || intent.prefixOnly) {
    score -= 12;
  }
  if (intent.type !== 'MATH_CONTENT' && isExecutableish(intent.type) && !intent.mathText) {
    score -= 6;
  }

  if (tokens.length > 0) score += 6;
  if (isValidTokenSequence(tokens)) score += 8;
  if (isValidTokenSequence(merged)) score += 10;
  if (isPlausibleContinuationScore(buffer, tokens)) score += 14;
  if (merC.startsWith(bufC) && merC.length > bufC.length) score += 10;
  if (merC === bufC && tokens.length > 0) score += 1;
  if (isMathRegression(buffer, tokens) && tokC !== bufC) score -= 25;
  if (isMathRegression(buffer, merged) && merC !== bufC) score -= 20;
  if (merC.includes('=') && !merC.startsWith('=') && !merC.endsWith('=')) score += 5;
  if (/[xyz]/i.test(merC) && /\d/.test(merC)) score += 4;
  if (/e/i.test(merC) && !/[xyz]/i.test(tokC) && !/(?:sin|cos|tan|log|ln|sqrt|pi|abs)/i.test(merC)) score -= 16;

  const last = buffer[buffer.length - 1];
  const first = tokens[0];
  if (
    last?.kind === 'term' &&
    /^\d+(?:\.\d+)?$/.test(last.value) &&
    first?.kind === 'term' &&
    /^[xyz]/i.test(first.value)
  ) {
    score += 18;
  }
  if (last?.kind === 'term' && /[xyz]$/i.test(last.value) && first?.kind === 'term' && /^[xyz]$/i.test(first.value)) {
    const lastVar = last.value.match(/[xyz]$/i)?.[0]?.toLowerCase();
    const firstVar = first.value[0]?.toLowerCase();
    if (lastVar && firstVar && lastVar === firstVar) score -= 12;
    else if (lastVar && firstVar && lastVar !== firstVar) score += 16;
  }
  if (last?.kind === 'term' && (first?.kind === 'operator' || first?.kind === 'equals')) {
    score += 20;
  }
  if ((last?.kind === 'operator' || last?.kind === 'equals') && first?.kind === 'term' && /^\d/.test(first.value)) {
    score += 14;
  }
  if (!last && first?.kind === 'term' && /^\d/.test(first.value)) {
    score += 8;
  }
  if (tokens.length === 1 && /^\d+(?:\.\d+)?[xyz]?$/i.test(tokens[0].value) && last?.kind !== 'term') {
    score += 8;
  }

  score += Math.min(tokens.length, 6);
  if (confidence > 0) score += confidence * 1.2;

  return { transcript: text, confidence, score, tokens };
}

function isExecutableish(type: string): boolean {
  return type.endsWith('_COMMAND');
}

export function pickBestHypothesis(
  alternatives: RecognitionAlternative[],
  buffer: MathToken[]
): ScoredHypothesis | null {
  if (!alternatives.length) return null;

  let best: ScoredHypothesis | null = null;
  for (const alternative of alternatives) {
    const scored = scoreMathHypothesis(alternative.transcript, buffer, alternative.confidence ?? 0);
    if (!best || scored.score > best.score) {
      best = scored;
    }
  }
  return best;
}
