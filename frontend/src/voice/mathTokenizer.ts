import { toNormalizedMathLexemes } from './speechHypothesisNormalizer';
import { MathToken } from './types';

const COMPARATOR = /^(<=|>=|=|<|>)$/;
const POWER_OP = /^\^(?:\d+|[xyz])$/i;
const SIMPLE_TERM =
  /^(?:\d+(?:\.\d+)?(?:[xyz](?:\^\d+)?|\^(?:\d+|[xyz]))?|[xyz](?:\^\d+)?|\d+pi|pi|r)$/i;

function isRichTerm(lexeme: string): boolean {
  if (!lexeme) return false;
  if (COMPARATOR.test(lexeme) || POWER_OP.test(lexeme)) return false;
  if (/^[+\-*/=,()|]$/.test(lexeme)) return false;
  return /[0-9a-z|()]/i.test(lexeme);
}

export function formatMathTokens(tokens: MathToken[]): string {
  if (tokens.length === 0) return '';

  return tokens
    .map((token, index) => {
      if (token.value === ',') {
        return ', ';
      }
      if (token.kind === 'operator' || token.kind === 'equals') {
        return index === 0 ? token.value : ` ${token.value} `;
      }
      return token.value;
    })
    .join('')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactMathTokens(tokens: MathToken[]): string {
  return tokens.map((token) => token.value).join('');
}

export function tokenFromLexeme(lexeme: string): MathToken | null {
  if (!lexeme) return null;
  if (COMPARATOR.test(lexeme)) {
    return lexeme === '=' ? { kind: 'equals', value: '=' } : { kind: 'equals', value: lexeme };
  }
  if (lexeme === ',') return { kind: 'operator', value: ',' };
  if (/^[+\-*/]$/.test(lexeme)) return { kind: 'operator', value: lexeme };
  if (POWER_OP.test(lexeme)) return { kind: 'operator', value: lexeme.toLowerCase() };
  if (SIMPLE_TERM.test(lexeme) || isRichTerm(lexeme)) {
    return { kind: 'term', value: lexeme };
  }
  return null;
}

function algebraVar(value: string): string | undefined {
  return value.match(/[xyz]$/i)?.[0]?.toLowerCase();
}

function isPiTerm(value: string): boolean {
  return /pi$/i.test(value);
}

function pushOrGlue(tokens: MathToken[], token: MathToken): void {
  const last = tokens[tokens.length - 1];
  if (!last) {
    tokens.push(token);
    return;
  }

  if (last.kind === 'term' && /^\d+(?:\.\d+)?$/.test(last.value) && token.kind === 'term' && /^[xyz]$/i.test(token.value)) {
    tokens[tokens.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (last.kind === 'term' && /^\d+(?:\.\d+)?$/.test(last.value) && token.kind === 'term' && /^pi/i.test(token.value)) {
    tokens[tokens.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (
    last.kind === 'term' &&
    /^\d+(?:\.\d+)?$/.test(last.value) &&
    token.kind === 'term' &&
    token.value.toLowerCase().startsWith(last.value) &&
    /[xyz^]/i.test(token.value)
  ) {
    tokens[tokens.length - 1] = { kind: 'term', value: token.value.toLowerCase() };
    return;
  }

  if (
    last.kind === 'term' &&
    token.kind === 'operator' &&
    POWER_OP.test(token.value) &&
    /(?:[0-9xyz)]|pi)$/i.test(last.value) &&
    !/\^/.test(last.value)
  ) {
    tokens[tokens.length - 1] = { kind: 'term', value: `${last.value}${token.value.toLowerCase()}` };
    return;
  }

  if (
    tokens.length >= 2 &&
    last.kind === 'operator' &&
    last.value === '*' &&
    tokens[tokens.length - 2].kind === 'term' &&
    /^\d+(?:\.\d+)?$/.test(tokens[tokens.length - 2].value) &&
    token.kind === 'term' &&
    /^[xyz]/i.test(token.value)
  ) {
    const coefficient = tokens[tokens.length - 2];
    tokens.splice(tokens.length - 2, 2, {
      kind: 'term',
      value: `${coefficient.value}${token.value.toLowerCase()}`,
    });
    return;
  }

  if (last.kind === 'term' && isPiTerm(last.value) && token.kind === 'term' && token.value.toLowerCase() === 'r') {
    tokens[tokens.length - 1] = { kind: 'term', value: `${last.value}*r` };
    return;
  }

  if (last.kind === 'term' && token.kind === 'term' && /\)$/.test(last.value) && /^\(/.test(token.value)) {
    tokens[tokens.length - 1] = { kind: 'term', value: `${last.value}${token.value}` };
    return;
  }

  if (last.kind === 'term' && token.kind === 'term') {
    const lastVar = algebraVar(last.value);
    const nextVar = token.value.match(/[xyz]/i)?.[0]?.toLowerCase();
    if (lastVar && nextVar && lastVar !== nextVar && /^(\d+(?:\.\d+)?)?[xyz]/i.test(token.value)) {
      tokens.push({ kind: 'operator', value: '+' }, token);
      return;
    }
  }

  tokens.push(token);
}

function glueLexemes(lexemes: string[]): MathToken[] {
  const tokens: MathToken[] = [];
  for (const lexeme of lexemes) {
    const token = tokenFromLexeme(lexeme);
    if (token) pushOrGlue(tokens, token);
  }
  return tokens;
}

export function tokenizeMathSpeech(raw: string, previousLexeme?: string, hasEquals = false): MathToken[] {
  return glueLexemes(toNormalizedMathLexemes(raw, previousLexeme, hasEquals));
}

export function compactLooksComplete(compact: string): boolean {
  const parts = compact.split(/[,;]/).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => {
    const match = part.match(/^(.+?)(<=|>=|<|>|=)(.+)$/);
    return Boolean(match?.[1] && match[3] && /[a-zA-Z0-9).|]/.test(match[1]) && /[a-zA-Z0-9).|]/.test(match[3]));
  });
}

export function isValidTokenSequence(tokens: MathToken[]): boolean {
  if (tokens.length === 0) return false;

  let expectTerm = true;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.kind === 'equals' || token.value === ',') {
      expectTerm = true;
      continue;
    }

    if (expectTerm) {
      if (
        token.kind === 'operator' &&
        token.value === '-' &&
        (i === 0 || tokens[i - 1].kind === 'equals' || tokens[i - 1].value === ',')
      ) {
        continue;
      }
      if (token.kind !== 'term') return false;
      expectTerm = false;
      continue;
    }

    if (token.kind === 'term') return false;
    expectTerm = true;
  }

  return true;
}

export function parsedEquationFromTokens(tokens: MathToken[]): string {
  return formatMathTokens(tokens);
}
