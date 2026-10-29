import { ATOM_FUNCTIONS, COMPARATOR_VALUES, PREFIX_FUNCTIONS } from './spokenMathPhrases';

function isComparator(value: string): boolean {
  return COMPARATOR_VALUES.has(value);
}

function takeBalanced(lexemes: string[], start: number, open: string, close: string): { joined: string; next: number } {
  let depth = 0;
  const parts: string[] = [];
  for (let i = start; i < lexemes.length; i += 1) {
    const item = lexemes[i];
    if (item === open) depth += 1;
    if (item === close) depth -= 1;
    parts.push(item);
    if (depth === 0) {
      return { joined: parts.join(''), next: i + 1 };
    }
  }
  return { joined: parts.join(''), next: lexemes.length };
}

function wrapPrefix(lexemes: string[], start: number): { term: string; next: number } {
  const fn = lexemes[start];
  let i = start + 1;
  if (lexemes[i] === 'of') i += 1;

  let body: string;
  if (lexemes[i] === '(') {
    const taken = takeBalanced(lexemes, i, '(', ')');
    body = taken.joined.slice(1, -1);
    i = taken.next;
  } else {
    const inner: string[] = [];
    while (i < lexemes.length && !isComparator(lexemes[i])) {
      inner.push(lexemes[i]);
      i += 1;
    }
    body = inner.join('');
  }

  if (!body) return { term: fn, next: i };
  if (fn === 'abs') return { term: `|${body}|`, next: i };
  return { term: `sqrt(${body})`, next: i };
}

function wrapAtom(lexemes: string[], start: number): { term: string; next: number } {
  const fn = lexemes[start];
  let i = start + 1;
  if (lexemes[i] === 'of') i += 1;

  const next = lexemes[i];
  if (!next || isComparator(next)) {
    return { term: fn, next: i };
  }

  if (next === '(') {
    const taken = takeBalanced(lexemes, i, '(', ')');
    return { term: `${fn}${taken.joined}`, next: taken.next };
  }

  return { term: `${fn}(${next})`, next: i + 1 };
}

function foldParens(lexemes: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lexemes.length; i += 1) {
    if (lexemes[i] === '(') {
      const taken = takeBalanced(lexemes, i, '(', ')');
      out.push(taken.joined);
      i = taken.next - 1;
      continue;
    }
    out.push(lexemes[i]);
  }
  return out;
}

function wrapFunctions(lexemes: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lexemes.length; i += 1) {
    const word = lexemes[i];
    if (PREFIX_FUNCTIONS.has(word)) {
      const wrapped = wrapPrefix(lexemes, i);
      out.push(wrapped.term);
      i = wrapped.next - 1;
      continue;
    }
    if (ATOM_FUNCTIONS.has(word)) {
      const wrapped = wrapAtom(lexemes, i);
      out.push(wrapped.term);
      i = wrapped.next - 1;
      continue;
    }
    out.push(word);
  }
  return out;
}

/** Collapse spoken groups/functions into single lexemes the tokenizer can keep as terms. */
export function foldSpokenLexemes(lexemes: string[]): string[] {
  return foldParens(wrapFunctions(lexemes));
}
