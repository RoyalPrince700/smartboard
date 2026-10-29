import { compactMathTokens, formatMathTokens, tokenizeMathSpeech } from './mathTokenizer';
import { ATOM_FUNCTIONS, PREFIX_FUNCTIONS } from './spokenMathPhrases';
import { MathToken } from './types';

export function isMathRegression(previous: MathToken[], candidate: MathToken[]): boolean {
  const prev = compactMathTokens(previous);
  const cand = compactMathTokens(candidate);
  if (!prev) return false;
  if (!cand) return true;
  if (cand === prev) return false;
  if (prev.startsWith(cand) && prev.length > cand.length) return true;
  if (/^\d+$/.test(cand) && new RegExp(`^${cand}[a-z]`, 'i').test(prev)) return true;
  return false;
}

export function isMathRegressionText(previousText: string, candidateText: string): boolean {
  return isMathRegression(tokenizeMathSpeech(previousText), tokenizeMathSpeech(candidateText));
}

function isPureNumber(token: MathToken): boolean {
  return token.kind === 'term' && /^\d+(?:\.\d+)?$/.test(token.value);
}

function isSingleVariable(token: MathToken): boolean {
  return token.kind === 'term' && /^[xyz]$/i.test(token.value);
}

function isPureNumericArithmeticBuffer(buffer: MathToken[]): boolean {
  const compact = compactMathTokens(buffer);
  if (!compact || /[a-zA-Z]/.test(compact)) return false;
  return buffer.some((token) => token.kind === 'equals');
}

function joinIncomingToken(result: MathToken[], token: MathToken): void {
  const last = result[result.length - 1];
  if (!last) {
    result.push(token);
    return;
  }

  if (last.value === token.value && last.kind === token.kind) {
    return;
  }

  if (isPureNumber(last) && isPureNumber(token)) {
    result[result.length - 1] = { kind: 'term', value: `${last.value}${token.value}` };
    return;
  }

  if (isPureNumber(last) && isSingleVariable(token)) {
    result[result.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (isPureNumber(last) && token.kind === 'term' && /^pi/i.test(token.value)) {
    result[result.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (
    isPureNumber(last) &&
    token.kind === 'term' &&
    token.value.toLowerCase().startsWith(last.value) &&
    /[xyz^]/i.test(token.value)
  ) {
    result[result.length - 1] = { kind: 'term', value: token.value.toLowerCase() };
    return;
  }

  if (
    last.kind === 'term' &&
    /^\d+[xyz]$/i.test(last.value) &&
    isSingleVariable(token) &&
    token.value.toLowerCase() === last.value.slice(-1).toLowerCase()
  ) {
    return;
  }

  if (
    last.kind === 'term' &&
    token.kind === 'operator' &&
    /^\^(?:\d+|[xyz])$/i.test(token.value) &&
    /(?:[0-9xyz)]|pi)$/i.test(last.value) &&
    !/\^/.test(last.value)
  ) {
    result[result.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (
    last.kind === 'term' &&
    token.kind === 'term' &&
    /^\d+(?:\.\d+)?$/.test(last.value) &&
    new RegExp(`^${last.value}\\^(?:\\d+|[xyz])$`, 'i').test(token.value)
  ) {
    result[result.length - 1] = { kind: 'term', value: token.value.toLowerCase() };
    return;
  }

  if (last.kind === 'operator' && token.kind === 'operator' && last.value === token.value) {
    return;
  }

  if (
    last.kind === 'term' &&
    token.kind === 'term' &&
    /[xyz]$/i.test(last.value) &&
    /[xyz]/i.test(token.value)
  ) {
    const lastVar = last.value.match(/[xyz]$/i)?.[0]?.toLowerCase();
    const nextVar = token.value.match(/[xyz]/i)?.[0]?.toLowerCase();
    if (lastVar && nextVar && lastVar !== nextVar) {
      result.push({ kind: 'operator', value: '+' }, token);
      return;
    }
  }

  if (last.kind === 'term' && /pi$/i.test(last.value) && token.kind === 'term' && token.value.toLowerCase() === 'r') {
    result[result.length - 1] = { kind: 'term', value: `${last.value}*r` };
    return;
  }

  if (last.kind === 'term' && token.kind === 'term' && /\)$/.test(last.value) && /^\(/.test(token.value)) {
    result[result.length - 1] = { kind: 'term', value: `${last.value}${token.value}` };
    return;
  }

  if (last.kind === 'equals' && token.kind === 'equals') {
    return;
  }

  // "4 + 5 =" should stay open until the user says solve — not pick up stray digits.
  if (last.kind === 'equals' && isPureNumericArithmeticBuffer(result) && token.kind === 'term') {
    return;
  }

  if (last.kind === 'operator' && token.kind === 'operator') {
    result[result.length - 1] = token;
    return;
  }

  result.push(token);
}

export function isPlausibleContinuation(buffer: MathToken[], incoming: MathToken[]): boolean {
  if (incoming.length === 0) return false;
  if (buffer.length === 0) return true;

  const last = buffer[buffer.length - 1];
  const first = incoming[0];

  if (isPureNumber(last) && isSingleVariable(first)) return true;
  if (isPureNumber(last) && first.kind === 'term' && first.value.toLowerCase().startsWith(last.value) && /[xyz^]/i.test(first.value)) {
    return true;
  }
  if (isPureNumber(last) && first.kind === 'term' && /^pi/i.test(first.value)) return true;
  if (last.kind === 'term' && /pi$/i.test(last.value) && first.kind === 'term' && first.value.toLowerCase() === 'r') {
    return true;
  }
  if (last.kind === 'term' && /\)$/.test(last.value) && first.kind === 'term' && /^\(/.test(first.value)) return true;
  if (
    last.kind === 'term' &&
    (PREFIX_FUNCTIONS.has(last.value) || ATOM_FUNCTIONS.has(last.value)) &&
    (first.kind === 'term' || (first.kind === 'operator' && first.value === '-'))
  ) {
    return true;
  }
  if (last.kind === 'term' && first.kind === 'operator' && /^\^(?:\d+|[xyz])$/i.test(first.value)) return true;
  if (last.kind === 'term' && (first.kind === 'operator' || first.kind === 'equals')) return true;
  if (last.kind === 'equals' && isPureNumericArithmeticBuffer(buffer)) return false;
  if ((last.kind === 'operator' || last.kind === 'equals') && first.kind === 'term') return true;
  if (last.kind === 'term' && first.kind === 'term' && /[xyz]$/i.test(last.value) && /[xyz]/i.test(first.value)) {
    const lastVar = last.value.match(/[xyz]$/i)?.[0]?.toLowerCase();
    const nextVar = first.value.match(/[xyz]/i)?.[0]?.toLowerCase();
    if (lastVar && nextVar && lastVar !== nextVar) return true;
  }
  if (last.kind === 'operator' && first.kind === 'operator') return true;

  return false;
}

function wrapIncomingFunction(
  buffer: MathToken[],
  incoming: MathToken[]
): { buffer: MathToken[]; incoming: MathToken[] } {
  const last = buffer[buffer.length - 1];
  if (!last || last.kind !== 'term' || incoming.length === 0) {
    return { buffer, incoming };
  }

  if (ATOM_FUNCTIONS.has(last.value) && incoming[0].kind === 'term') {
    return {
      buffer: [...buffer.slice(0, -1), { kind: 'term', value: `${last.value}(${incoming[0].value})` }],
      incoming: incoming.slice(1),
    };
  }

  if (PREFIX_FUNCTIONS.has(last.value)) {
    const inner: string[] = [];
    let index = 0;
    for (; index < incoming.length; index += 1) {
      const token = incoming[index];
      if (token.kind === 'equals' || token.value === ',') break;
      inner.push(token.value);
    }
    if (inner.length === 0) return { buffer, incoming };
    const body = inner.join('');
    const wrapped = last.value === 'abs' ? `|${body}|` : `sqrt(${body})`;
    return {
      buffer: [...buffer.slice(0, -1), { kind: 'term', value: wrapped }],
      incoming: incoming.slice(index),
    };
  }

  return { buffer, incoming };
}

export function joinMathTokens(buffer: MathToken[], incoming: MathToken[]): MathToken[] {
  const wrapped = wrapIncomingFunction(buffer, incoming);
  const result = [...wrapped.buffer];
  for (const token of wrapped.incoming) {
    joinIncomingToken(result, token);
  }
  return result;
}

/**
 * Merge a new speech segment into the persistent math buffer.
 * Never reconstructs the buffer from the latest browser transcript alone.
 */
export function mergeIntoPersistentBuffer(buffer: MathToken[], incoming: MathToken[]): MathToken[] {
  if (incoming.length === 0) return buffer;
  if (buffer.length === 0) return incoming;

  const bufC = compactMathTokens(buffer);
  const incC = compactMathTokens(incoming);

  if (incC === bufC) return buffer;

  // A new fragment that continues the live equation must join, even if it
  // happens to be a prefix of the compact buffer (e.g. trailing "2" after "+").
  if (isPlausibleContinuation(buffer, incoming)) {
    return joinMathTokens(buffer, incoming);
  }

  if (isMathRegression(buffer, incoming)) return buffer;
  if (incC.startsWith(bufC) && incC.length > bufC.length) return incoming;

  return joinMathTokens(buffer, incoming);
}

export function previewBuffer(buffer: MathToken[], incoming: MathToken[]): MathToken[] {
  return mergeIntoPersistentBuffer(buffer, incoming);
}

export function formatPersistentBuffer(tokens: MathToken[]): string {
  return formatMathTokens(tokens);
}

export function isHypothesisBreak(previous: MathToken[], incoming: MathToken[]): boolean {
  const prevC = compactMathTokens(previous);
  const nextC = compactMathTokens(incoming);
  if (!prevC || !nextC) return false;
  if (prevC === nextC) return false;
  if (isMathRegression(previous, incoming)) return false;
  if (nextC.startsWith(prevC) || prevC.startsWith(nextC)) return false;
  if (nextC.includes(prevC) && nextC.length > prevC.length) return false;
  return true;
}

export function isHypothesisBreakText(previousText: string, nextText: string): boolean {
  return isHypothesisBreak(tokenizeMathSpeech(previousText), tokenizeMathSpeech(nextText));
}
