/**
 * Spoken-math aliases. Keep this list small: extra English lookalikes
 * (es, is, e, eggs, who, …) get misheard as x / 2 / 4 instead of equals.
 */

export const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  nought: '0',
  naught: '0',
  oh: '0',
  ziro: '0',
  one: '1',
  won: '1',
  wan: '1',
  wun: '1',
  two: '2',
  to: '2',
  too: '2',
  tu: '2',
  three: '3',
  tree: '3',
  four: '4',
  for: '4',
  fore: '4',
  five: '5',
  fife: '5',
  six: '6',
  sicks: '6',
  seven: '7',
  seben: '7',
  eight: '8',
  ate: '8',
  nine: '9',
  nain: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
};

/** Algebra variables. `why`/`wye`/`zed`/`zee` are common Chrome mishears. */
export const VARIABLE_WORDS: Record<string, string> = {
  x: 'x',
  ex: 'x',
  ecs: 'x',
  eks: 'x',
  ecks: 'x',
  y: 'y',
  why: 'y',
  wye: 'y',
  z: 'z',
  zed: 'z',
  zee: 'z',
};

export const CONSTANT_WORDS: Record<string, string> = {
  pi: 'pi',
  pie: 'pi',
};

const FUNCTION_WORDS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

const COMPARATOR_WORDS: Record<string, string> = {
  gt: '>',
  lt: '<',
};

const GROUP_WORDS: Record<string, string> = {
  '(': '(',
  ')': ')',
};

const SEPARATOR_WORDS = new Set(['comma', 'coma', 'semicolon']);

const MINUS_WORDS = new Set(['minus', 'mine', 'minas', 'minos', 'minu']);

export const OPERATOR_WORDS: Record<string, string> = {
  plus: '+',
  minus: '-',
  equals: '=',
  equal: '=',
  over: '/',
};

export const POWER_WORDS: Record<string, string> = {
  square: '^2',
  squared: '^2',
  cube: '^3',
  cubed: '^3',
};

/** Incomplete digit fragments only — never prefixes that match English words. */
const NUMBER_PREFIX: Array<[RegExp, string]> = [
  [/^tw/, '2'],
  [/^thr/, '3'],
  [/^fou/, '4'],
  [/^fiv/, '5'],
  [/^sev/, '7'],
  [/^eig/, '8'],
  [/^nin/, '9'],
  [/^zer/, '0'],
];

const NUMBER_SUFFIX: Record<string, string> = {
  wo: '2',
  ree: '3',
  ive: '5',
  ven: '7',
  ight: '8',
};

const X_AFTER_BARE_NUMBER = /^(ex|ecs|eks|ecks|s|x)$/i;

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Canonical words only — never fuzzy-match onto x aliases or extra number slang. */
const FUZZY_TARGETS: Array<[string, string]> = [
  ['zero', '0'],
  ['three', '3'],
  ['four', '4'],
  ['five', '5'],
  ['seven', '7'],
  ['eight', '8'],
  ['nine', '9'],
  ['plus', '+'],
  ['minus', '-'],
  ['equal', '='],
  ['equals', '='],
  ['square', '^2'],
  ['squared', '^2'],
  ['cube', '^3'],
  ['cubed', '^3'],
];

function fuzzyDictionaryMatch(word: string): string | null {
  if (word.length < 4) return null;
  if (/^eq/.test(word)) return '=';

  const minusDistance = levenshtein(word, 'minus');
  const nineDistance = Math.min(levenshtein(word, 'nine'), levenshtein(word, 'nain'));
  if (minusDistance <= 1 && minusDistance <= nineDistance) {
    return '-';
  }

  let best: string | null = null;
  let bestDistance = 2;
  for (const [alias, value] of FUZZY_TARGETS) {
    if (alias.length < 4) continue;
    const distance = levenshtein(word, alias);
    if (distance === 1 && distance < bestDistance) {
      bestDistance = distance;
      best = value;
    }
  }
  return best;
}

function isBareNumber(lexeme?: string): boolean {
  return Boolean(lexeme && /^\d+(?:\.\d+)?$/.test(lexeme));
}

function isTermLexeme(lexeme?: string): boolean {
  return Boolean(lexeme && /(?:[0-9xyz)]|pi)$/i.test(lexeme));
}

export function resolveSpokenWord(word: string, previousLexeme?: string): string | null {
  const raw = word.trim().toLowerCase();
  if (!raw) return null;

  if (/^\d+(?:\.\d+)?$/.test(raw)) return raw;
  if (raw === ',' || raw === ';') return ',';
  if (raw === '(' || raw === ')') return raw;
  if (raw === '>' || raw === '<' || raw === '>=' || raw === '<=') return raw;
  if (raw === '|') return '|';
  if (/^\^(?:\d+|[xyz])$/i.test(raw)) return raw.toLowerCase();
  if (/^\d+(?:\.\d+)?\^(?:\d+|[xyz])$/i.test(raw)) return raw.toLowerCase();
  if (/^[0-9xyz+\-*/^().|]+$/i.test(raw) && /[+\-*/^]/i.test(raw) && /[0-9xyz]/i.test(raw)) {
    return raw.toLowerCase();
  }

  const compactVar = raw.match(/^(\d+)(ex|ecs|eks|ecks|s|x|y|why|wye|z|zed|zee)$/i);
  if (compactVar) {
    const letter = /^(?:y|why|wye)$/i.test(compactVar[2])
      ? 'y'
      : /^(?:z|zed|zee)$/i.test(compactVar[2])
        ? 'z'
        : 'x';
    return `${compactVar[1]}${letter}`;
  }

  const compactPower = raw.match(/^(\d+[xyz]?)(squared|square|cubed|cube)$/i);
  if (compactPower) {
    const power = /cube/i.test(compactPower[2]) ? '^3' : '^2';
    return `${compactPower[1]}${power}`;
  }
  const letterPower = raw.match(/^([xyz])(squared|square|cubed|cube)$/i);
  if (letterPower) {
    const power = /cube/i.test(letterPower[2]) ? '^3' : '^2';
    return `${letterPower[1]}${power}`;
  }

  const stripped = raw.replace(/[^a-z0-9]/g, '');
  if (!stripped) return null;

  // Lone "e" is a fragment of "equals", never a variable.
  if (stripped === 'e' || stripped === 'ee') return null;

  if (/^\d+(?:\.\d+)?$/.test(stripped)) return stripped;
  if (/^\d+(?:\.\d+)?pi(?:\*r)?$/i.test(stripped)) return stripped.toLowerCase();
  if (NUMBER_WORDS[stripped] !== undefined) return NUMBER_WORDS[stripped];
  if (CONSTANT_WORDS[stripped] !== undefined) return CONSTANT_WORDS[stripped];
  if (FUNCTION_WORDS.has(stripped)) return stripped;
  if (OPERATOR_WORDS[stripped] !== undefined) return OPERATOR_WORDS[stripped];
  if (POWER_WORDS[stripped] !== undefined) return POWER_WORDS[stripped];
  if (GROUP_WORDS[stripped] !== undefined) return GROUP_WORDS[stripped];
  if (COMPARATOR_WORDS[stripped] !== undefined) return COMPARATOR_WORDS[stripped];
  if (SEPARATOR_WORDS.has(stripped) || stripped === ',' || stripped === ';') return ',';

  if (/^eq/.test(stripped)) return '=';

  if (MINUS_WORDS.has(stripped)) return '-';

  if (isTermLexeme(previousLexeme) && stripped === 'is') {
    return '=';
  }

  if (VARIABLE_WORDS[stripped] !== undefined) return VARIABLE_WORDS[stripped];

  if (/^\d+(?:\.\d+)?[xyz]$/i.test(stripped)) return stripped.toLowerCase();

  if (isBareNumber(previousLexeme) && X_AFTER_BARE_NUMBER.test(stripped)) {
    return 'x';
  }

  if (previousLexeme && /pi$/i.test(previousLexeme) && stripped === 'r') {
    return 'r';
  }

  if (stripped.length <= 4) {
    for (const [pattern, value] of NUMBER_PREFIX) {
      if (pattern.test(stripped)) return value;
    }
  }
  if (NUMBER_SUFFIX[stripped]) return NUMBER_SUFFIX[stripped];

  return fuzzyDictionaryMatch(stripped);
}

export function isVariableWord(word: string): boolean {
  const resolved = resolveSpokenWord(word);
  return resolved === 'x' || resolved === 'y' || resolved === 'z' || Boolean(VARIABLE_WORDS[word.toLowerCase()]);
}

export function isNumericLexeme(word: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(word) || NUMBER_WORDS[word.toLowerCase()] !== undefined;
}
