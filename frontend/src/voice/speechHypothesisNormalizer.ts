/**
 * Token-aware spoken-math normalization.
 * Maps whole words/phrases only — never global substring replacements like replaceAll("ex", "x").
 */

import {
  OPERATOR_WORDS,
  isVariableWord,
  resolveSpokenWord,
} from './speechAliases';
import { foldSpokenLexemes } from './spokenMathFold';
import { rewriteSpokenMathPhrases, rewriteSpokenPowerPhrases } from './spokenMathPhrases';

export { rewriteSpokenMathPhrases, rewriteSpokenPowerPhrases };

function cleanSpeech(text: string): string {
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

function isExponentValue(value: string): boolean {
  return /^\d+$/.test(value) || /^[xyz]$/i.test(value);
}

function looksLikeMathLexeme(word: string, previous?: string): boolean {
  const resolved = resolveSpokenWord(word, previous);
  return Boolean(
    resolved ||
      /^[+\-*/=<>()|,]$/.test(word) ||
      /^(<=|>=)$/.test(word) ||
      /^\^(?:\d+|[xyz])$/i.test(word) ||
      /^\d+(?:\.\d+)?(?:[xyz](?:\^\d+)?|\^(?:\d+|[xyz]))?$/i.test(word)
  );
}

const COMPARATORS = new Set(['=', '>', '<', '>=', '<=', ',']);
const GROUPS = new Set(['(', ')']);
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

/**
 * Convert a speech hypothesis into math lexemes (numbers, variables, operators).
 * Unknown non-math words are dropped rather than injected into the equation.
 */
export function toNormalizedMathLexemes(
  raw: string,
  previousLexeme?: string,
  hasEquals = false
): string[] {
  const cleaned = rewriteSpokenMathPhrases(cleanSpeech(raw));
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/).filter(Boolean);
  const lexemes: string[] = [];
  const seenEquals = () =>
    hasEquals || lexemes.some((item) => COMPARATORS.has(item) && item !== ',');

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const prev = lexemes[lexemes.length - 1] ?? previousLexeme;

    if (word === '^' || /^\^(?:\d+|[xyz])$/i.test(word)) {
      let exponent = word.startsWith('^') && word.length > 1 ? word.slice(1).toLowerCase() : '';
      if (!exponent) {
        const next = words[i + 1];
        const nextResolved = next ? resolveSpokenWord(next, prev) : null;
        if (nextResolved && isExponentValue(nextResolved)) {
          exponent = nextResolved.toLowerCase();
          i += 1;
        }
      }
      if (exponent) {
        lexemes.push(`^${exponent}`);
      }
      continue;
    }

    if (word === ',' || word === ';' || word === 'comma' || word === 'coma' || word === 'semicolon') {
      lexemes.push(',');
      continue;
    }

    if (GROUPS.has(word)) {
      lexemes.push(word);
      continue;
    }

    if (word === 'and') {
      const afterTerm = Boolean(prev && /(?:[0-9xyz)]|pi)$/i.test(prev));
      if (seenEquals() && afterTerm) {
        lexemes.push(',');
      } else if (afterTerm) {
        lexemes.push('+');
      }
      continue;
    }

    if (word === 'times') {
      const next = words[i + 1];
      const prevIsNumber = Boolean(prev && /^\d+(?:\.\d+)?$/.test(prev));
      const nextResolved = next ? resolveSpokenWord(next, prev) : null;
      if (
        prevIsNumber &&
        next &&
        (isVariableWord(next) || nextResolved === 'x' || nextResolved === 'pi')
      ) {
        continue;
      }
      lexemes.push('*');
      continue;
    }

    if (word === 'over') {
      const next = words[i + 1];
      if (prev && looksLikeMathLexeme(prev) && next && looksLikeMathLexeme(next, prev)) {
        lexemes.push('/');
      }
      continue;
    }

    const resolved = resolveSpokenWord(word, prev);

    if (resolved === '+' || resolved === '-' || resolved === '=' || resolved === ',' || resolved === '>' || resolved === '<' || resolved === '>=' || resolved === '<=') {
      lexemes.push(resolved);
      continue;
    }

    if (OPERATOR_WORDS[word]) {
      lexemes.push(OPERATOR_WORDS[word]);
      continue;
    }

    if (resolved) {
      if (/^\d+[xyz]$/.test(resolved)) {
        const letter = resolved.slice(-1);
        const digits = resolved.slice(0, -1);
        if (prev && prev === digits) {
          lexemes[lexemes.length - 1] = resolved;
        } else {
          lexemes.push(digits, letter);
        }
        continue;
      }
      if (
        /^\^(?:\d+|[xyz])$/i.test(resolved) ||
        /^\d+[xyz]?\^(?:\d+|[xyz])$/i.test(resolved) ||
        /^[xyz]\^\d+$/i.test(resolved)
      ) {
        lexemes.push(resolved);
        continue;
      }
      lexemes.push(resolved);
      continue;
    }

    if (/^[+\-*/=<>()|,]$/.test(word) || /^(<=|>=)$/.test(word) || /^\^(?:\d+|[xyz])$/i.test(word)) {
      lexemes.push(word === ';' ? ',' : word);
      continue;
    }

    if (FUNCTIONS.has(word)) {
      lexemes.push(word);
      continue;
    }

    if (
      /^\d+(?:\.\d+)?(?:[xyz](?:\^\d+)?|\^(?:\d+|[xyz]))?$/i.test(word) ||
      /^[xyz](?:\^\d+)?$/i.test(word) ||
      /^(?:\d+(?:\.\d+)?)?pi(?:\*r)?$/i.test(word)
    ) {
      lexemes.push(word.toLowerCase());
    }
  }

  return foldSpokenLexemes(lexemes);
}

export function normalizeSpeechHypothesis(raw: string): string {
  return toNormalizedMathLexemes(raw).join(' ');
}
