/**
 * Compatibility helpers for older voice-hearing tests.
 * New dictation uses the persistent math buffer in `src/voice`.
 */

import { pickBestHypothesis } from '../voice/hypothesisScorer';
import { formatMathTokens, tokenizeMathSpeech } from '../voice/mathTokenizer';
import { isMathRegression, mergeIntoPersistentBuffer } from '../voice/persistentMathBuffer';
import { normalizeSpeechHypothesis } from '../voice/speechHypothesisNormalizer';

export function normalizeMathHearingChunk(text: string): string {
  return normalizeSpeechHypothesis(text);
}

export function pickRicherTranscript(finalText: string, interimText: string): string {
  const finalTokens = tokenizeMathSpeech(finalText);
  const interimTokens = tokenizeMathSpeech(interimText);
  if (interimTokens.length === 0) return formatMathTokens(finalTokens) || finalText.trim();
  if (finalTokens.length === 0) return formatMathTokens(interimTokens) || interimText.trim();
  if (isMathRegression(interimTokens, finalTokens)) {
    return formatMathTokens(interimTokens);
  }
  return formatMathTokens(finalTokens);
}

export function mergeHearingChunk(existing: string, incoming: string): string {
  return formatMathTokens(
    mergeIntoPersistentBuffer(tokenizeMathSpeech(existing), tokenizeMathSpeech(incoming))
  );
}

export function pickBestAlternative(result: SpeechRecognitionResult): string {
  const alternatives = [];
  for (let i = 0; i < result.length; i += 1) {
    alternatives.push({
      transcript: result[i]?.transcript ?? '',
      confidence: result[i]?.confidence ?? 0,
    });
  }
  return pickBestHypothesis(alternatives, [])?.transcript ?? result[0]?.transcript ?? '';
}
