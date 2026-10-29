import { rewriteSpokenMathPhrases } from '../voice/speechHypothesisNormalizer';
import { compactLooksComplete, tokenizeMathSpeech, tokenFromLexeme } from '../voice/mathTokenizer';

export type VoiceCommand =
  | { type: 'append'; tokens: string[]; thenSolve?: boolean }
  | { type: 'write-equation'; equation: string }
  | { type: 'solve'; writeToBoard: boolean }
  | { type: 'solve-equation'; equation: string; writeToBoard: boolean }
  | { type: 'cancel' }
  | { type: 'undo' }
  | { type: 'ignore'; reason: string }
  | { type: 'general'; text: string };

/** Solve phrases, including Chrome short forms so/sol/solv. */
const SOLVE_ONLY_PATTERN =
  /^(?:please\s+)?(?:solv(?:e|ed)?|sol|so|work\s+it\s+out|show(?:\s+me)?(?:\s+the)?\s+solution)(?:\s+(?:it|this|that|now|the\s+equation)?)?$/i;

const SOLVE_AND_WRITE_PATTERN =
  /^solve\s+and\s+(?:show|write|put(?:\s+it)?(?:\s+on)?(?:\s+the)?\s+board)$/i;

const CANCEL_PATTERN =
  /^(?:cancel|clear|scratch\s+that|never\s*mind|forget\s+(?:it|that)|start\s+over|delete(?:\s+(?:that|it|all))?)$/i;

const UNDO_PATTERN =
  /^(?:undo|back|delete\s+last|remove\s+last|go\s+back)$/i;

const WRITE_PREFIX_PATTERN =
  /^(?:write|put|type|say|dictate|the\s+equation\s+is|equation\s+is|let'?s\s+write)\s+/i;

const QUESTION_PATTERN =
  /\b(?:what|how|when|where|who|explain|tell\s+me|define|describe|help)\b/i;

/** Trailing solve, including Chrome short forms so/sol/solv. */
const TRAILING_SOLVE_PATTERN =
  /\s+(?:please\s+)?(?:solv(?:e|ed)?|sol|so|work\s+it\s+out)(?:\s+(?:it|this|that|now|the\s+equation)?)?$/i;

const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  nought: '0',
  oh: '0',
  one: '1',
  won: '1',
  two: '2',
  to: '2',
  too: '2',
  three: '3',
  four: '4',
  for: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ate: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
};

/** Strip punctuation speech engines often append ("Solve.", "zero,"). */
export function cleanVoiceText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/;/g, ' , ')
    .replace(/,/g, ' , ')
    .replace(/([()|<>])/g, ' $1 ')
    .replace(/>\s*=/g, ' >= ')
    .replace(/<\s*=/g, ' <= ')
    .replace(/[.!?:…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collapseVariableSpacing(text: string): string {
  let result = text;
  for (let pass = 0; pass < 3; pass += 1) {
    // Only join digit + x/y: "2 x" → "2x". Never glue leftover "e" from "equals".
    result = result.replace(/(\d)\s+([xyz])(?![a-zA-Z])/gi, '$1$2');
    result = result.replace(/([xyz])\s+(\d)/gi, '$1$2');
    result = result.replace(/(\d)\s+pi\b/gi, '$1pi');
    result = result.replace(/\bpi\s+r\b/gi, 'pi*r');
  }
  return result;
}

function replaceNumberWords(text: string): string {
  return text.replace(
    /\b(zero|nought|oh|one|won|two|to|too|three|four|for|five|six|seven|eight|ate|nine|ten|eleven|twelve)\b/gi,
    (match) => NUMBER_WORDS[match.toLowerCase()] ?? match
  );
}

export function stripTrailingSolve(text: string): { text: string; wantsSolve: boolean } {
  const cleaned = cleanVoiceText(text);
  if (TRAILING_SOLVE_PATTERN.test(cleaned)) {
    return {
      text: cleaned.replace(TRAILING_SOLVE_PATTERN, '').trim(),
      wantsSolve: true,
    };
  }
  return { text: cleaned, wantsSolve: false };
}

export function normalizeSpokenMath(text: string): string {
  let normalized = cleanVoiceText(text);
  normalized = normalized.replace(WRITE_PREFIX_PATTERN, '');
  // Strip a trailing confirmed "solve" before math tokenization.
  normalized = normalized.replace(TRAILING_SOLVE_PATTERN, ' ');

  normalized = rewriteSpokenMathPhrases(normalized);
  normalized = normalized.replace(/\b(?:comma|coma|semicolon)\b/g, ' , ');
  normalized = normalized.replace(/\s+and\s+/gi, (match, offset, full: string) =>
    /[<>=]/.test(full.slice(0, offset)) ? ' , ' : ' + '
  );

  const wordReplacements: Array<[RegExp, string]> = [
    [/\bplus\b/g, ' + '],
    [/\bminus\b/g, ' - '],
    [/\btimes\b|\bmultiplied\s+by\b|\bmultiply\s+by\b/g, ' * '],
    [/\bdivided\s+by\b|\bover\b/g, ' / '],
    [/\b(?:ex|x)\b(?=\s|$|[+\-*/=^,<>()|])/g, 'x'],
    [/\b(?:why|wye)\b/g, 'y'],
    [/\b(?:zed|zee)\b/g, 'z'],
    [/\bpie\b/g, 'pi'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Map number words in math positions (including "six x" → later collapsed to 6x).
  normalized = normalized.replace(
    /(^|=|\+|-|\/|\*|\s)(zero|nought|oh|one|won|two|to|too|three|four|for|five|six|seven|eight|ate|nine|ten|eleven|twelve)\b/gi,
    (_, prefix: string, word: string) => `${prefix}${NUMBER_WORDS[word.toLowerCase()] ?? word}`
  );

  if (
    /^(zero|nought|oh|one|won|two|to|too|three|four|for|five|six|seven|eight|ate|nine|ten|eleven|twelve)$/i.test(
      normalized.trim()
    )
  ) {
    normalized = replaceNumberWords(normalized);
  }

  normalized = normalized.replace(/=\s*to\b/g, '= ');
  normalized = collapseVariableSpacing(normalized);
  // Keep exponents glued: 2x^2, 2^x, 2^5
  normalized = normalized.replace(/\s*\^\s*/g, '^');
  normalized = normalized.replace(/\s*(<=|>=|<|>|[+\-*/=])\s*/g, ' $1 ');
  normalized = normalized.replace(/([0-9a-zA-Z)])\^(\d+|[xyz])/gi, '$1^$2');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/** Split spoken math into appendable tokens (terms and operators). */
export function tokenizeSpokenMath(text: string): string[] {
  return tokenizeMathSpeech(text).map((token) => token.value);
}

/** Collapse duplicate equals signs from voice or keyboard input (e.g. "3 + 4 = ="). */
export function sanitizeEquationInput(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return '';

  // Repeated equals with optional spaces: "= =", "==", "=  ="
  cleaned = cleaned.replace(/(?:\s*=\s*){2,}/g, ' = ');

  // Trailing equals waiting for a right-hand value — keep a single "="
  cleaned = cleaned.replace(/\s*=\s*$/g, ' =');

  return cleaned.replace(/\s+/g, ' ').trim();
}

/** Numeric-only expression waiting for a result, e.g. "4 + 5 =". */
export function isIncompleteArithmeticEquation(text: string): boolean {
  const cleaned = sanitizeEquationInput(text);
  if (!cleaned.includes('=') || /[a-zA-Z]/.test(cleaned.replace(/\s/g, ''))) return false;
  return /=\s*$/.test(cleaned);
}

/** Show the solved form in the question bar, e.g. "4 + 5 = 9". */
export function formatSolvedArithmeticDisplay(input: string, answer: string): string {
  const lhs = sanitizeEquationInput(input.split('=')[0] ?? input).trim();
  const numericAnswer = answer.split(/[,|]/)[0]?.trim() ?? answer;
  if (!lhs) return numericAnswer;
  return `${lhs} = ${numericAnswer}`;
}

export function isCompleteEquation(text: string): boolean {
  return compactLooksComplete(text.replace(/\s+/g, ''));
}

/** Prefer the board equation when speech would wipe a digit/term already captured. */
export function pickBestEquation(spoken: string, board: string): string {
  const a = spoken.replace(/\s+/g, '');
  const b = board.replace(/\s+/g, '');
  if (!a) return b;
  if (!b) return a;

  const aComplete = isCompleteEquation(a);
  const bComplete = isCompleteEquation(b);

  if (bComplete && !aComplete) return b;
  if (aComplete && !bComplete) return a;

  // Same completeness — keep the longer (more digits/terms).
  if (b.length > a.length && (b.startsWith(a) || b.includes(a))) return b;
  if (a.length > b.length && (a.startsWith(b) || a.includes(b))) return a;

  return aComplete || bComplete ? (a.length >= b.length ? a : b) : a.length >= b.length ? a : b;
}

function looksLikeMathFragment(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  return tokens.every((token) => tokenFromLexeme(token) !== null);
}

export function parseVoiceCommand(text: string): VoiceCommand {
  const trimmed = cleanVoiceText(text);
  if (!trimmed) {
    return { type: 'ignore', reason: 'empty' };
  }

  if (CANCEL_PATTERN.test(trimmed)) {
    return { type: 'cancel' };
  }

  if (UNDO_PATTERN.test(trimmed)) {
    return { type: 'undo' };
  }

  if (/^(?:squared|square)$/i.test(trimmed)) {
    return { type: 'append', tokens: ['^2'] };
  }
  if (/^(?:cubed|cube)$/i.test(trimmed)) {
    return { type: 'append', tokens: ['^3'] };
  }

  // Confirmed "solve" only — prefixes like so/sol/solv must never match.
  if (SOLVE_AND_WRITE_PATTERN.test(trimmed) || SOLVE_ONLY_PATTERN.test(trimmed)) {
    return { type: 'solve', writeToBoard: false };
  }
  if (/^(?:please\s+)?(?:solv(?:e|ed)?|sol|so)\b/i.test(trimmed) && !/[0-9=+]/.test(trimmed)) {
    return { type: 'solve', writeToBoard: false };
  }

  const solveWithEquation = trimmed.match(/^(?:please\s+)?(?:solv(?:e|ed)?|sol|so)\s+(.+)$/i);
  if (solveWithEquation) {
    const equation = tokenizeSpokenMath(solveWithEquation[1]).join('');
    if (isCompleteEquation(equation)) {
      return { type: 'solve-equation', equation, writeToBoard: false };
    }
  }

  const { text: withoutSolve, wantsSolve } = stripTrailingSolve(trimmed);
  const tokens = tokenizeSpokenMath(withoutSolve);
  if (looksLikeMathFragment(tokens)) {
    const equation = tokens.join('');
    if (wantsSolve && isCompleteEquation(equation)) {
      return { type: 'solve-equation', equation, writeToBoard: false };
    }
    if (wantsSolve && tokens.length > 0) {
      // e.g. board has "2x+5=" and speech is "6 so" → append 6 then solve
      return { type: 'append', tokens, thenSolve: true };
    }
    if (wantsSolve) {
      return { type: 'solve', writeToBoard: false };
    }
    if (isCompleteEquation(equation) && tokens.length >= 3) {
      return { type: 'write-equation', equation };
    }
    return { type: 'append', tokens };
  }

  if (wantsSolve) {
    return { type: 'solve', writeToBoard: false };
  }

  if (trimmed.length <= 16 && !QUESTION_PATTERN.test(trimmed)) {
    return { type: 'ignore', reason: 'short-noise' };
  }

  if (QUESTION_PATTERN.test(trimmed) && trimmed.length > 12) {
    return { type: 'general', text: text.trim() };
  }

  return { type: 'ignore', reason: 'unrecognized' };
}
