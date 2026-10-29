import { tokenizeMathSpeech } from './mathTokenizer';
import { VoiceIntent, VoiceIntentType } from './types';

interface CommandSpec {
  type: Exclude<VoiceIntentType, 'MATH_CONTENT' | 'COMMAND_CANDIDATE' | 'UNKNOWN'>;
  phrases: string[];
}

const COMMAND_SPECS: CommandSpec[] = [
  {
    type: 'SOLVE_COMMAND',
    phrases: [
      'solve',
      'solv',
      'sol',
      'so',
      'please solve',
      'solve it',
      'solve this',
      'solve that',
      'solve now',
      'solve the equation',
      'please solve it',
      'please solve this',
      'work it out',
      'show the solution',
      'show me the solution',
    ],
  },
  {
    type: 'CLEAR_COMMAND',
    phrases: [
      'clear',
      'clear the board',
      'cancel',
      'scratch that',
      'never mind',
      'forget it',
      'forget that',
      'start over',
      'delete all',
    ],
  },
  {
    type: 'UNDO_COMMAND',
    phrases: ['undo', 'delete that', 'remove that', 'go back', 'delete last', 'remove last'],
  },
  {
    type: 'REDO_COMMAND',
    phrases: ['redo'],
  },
  {
    type: 'EXPLAIN_COMMAND',
    phrases: ['explain', 'explain this', 'explain it', 'explain that'],
  },
  {
    type: 'READ_ALOUD_COMMAND',
    phrases: ['read aloud', 'read it', 'read this', 'read that'],
  },
  {
    type: 'STOP_COMMAND',
    phrases: ['stop', 'stop reading', 'be quiet'],
  },
  {
    type: 'NEXT_STEP_COMMAND',
    phrases: ['next step'],
  },
  {
    type: 'PREVIOUS_STEP_COMMAND',
    phrases: ['previous step', 'go back a step'],
  },
  {
    type: 'CHECK_ANSWER_COMMAND',
    phrases: ['check answer', 'check my answer', 'check the answer'],
  },
];

const ALL_PHRASES = COMMAND_SPECS.flatMap((spec) =>
  spec.phrases.map((phrase) => ({ phrase, type: spec.type }))
).sort((a, b) => b.phrase.length - a.phrase.length);

function cleanUtterance(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/;/g, ' , ')
    .replace(/,/g, ' , ')
    .replace(/[.!?:…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function confidenceAllowsConfirm(confidence: number): boolean {
  if (confidence <= 0) return true;
  return confidence >= 0.35;
}

function findExactCommand(text: string): { type: CommandSpec['type']; phrase: string } | null {
  for (const entry of ALL_PHRASES) {
    if (text === entry.phrase) return entry;
  }
  return null;
}

/** True when `text` is a proper prefix of a known command and is not itself a command. */
export function isCommandPrefixOnly(text: string): boolean {
  const cleaned = cleanUtterance(text);
  if (!cleaned || cleaned.length < 2) return false;
  if (findExactCommand(cleaned)) return false;
  // "ex" is a variable, not a prefix of "explain".
  if (hasMathContent(cleaned)) return false;
  return ALL_PHRASES.some(
    (entry) => entry.phrase.startsWith(cleaned) && cleaned !== entry.phrase && entry.phrase.length > cleaned.length
  );
}

function findTrailingCommand(text: string): {
  mathText: string;
  command: { type: CommandSpec['type']; phrase: string } | null;
  prefixOnly: boolean;
} {
  for (const entry of ALL_PHRASES) {
    if (text === entry.phrase) {
      return { mathText: '', command: entry, prefixOnly: false };
    }
    const suffix = ` ${entry.phrase}`;
    if (text.endsWith(suffix)) {
      return {
        mathText: text.slice(0, -suffix.length).trim(),
        command: entry,
        prefixOnly: false,
      };
    }
  }

  const words = text.split(' ');
  const last = words[words.length - 1] ?? '';
  if (last && isCommandPrefixOnly(last)) {
    return {
      mathText: words.slice(0, -1).join(' ').trim(),
      command: null,
      prefixOnly: true,
    };
  }

  return { mathText: text, command: null, prefixOnly: false };
}

function hasMathContent(text: string, previousLexeme?: string, hasEquals = false): boolean {
  return tokenizeMathSpeech(text, previousLexeme, hasEquals).length > 0;
}

export function classifyVoiceIntent(
  raw: string,
  options: { isFinal: boolean; confidence?: number; previousLexeme?: string; hasEquals?: boolean }
): VoiceIntent {
  const cleaned = cleanUtterance(raw);
  const confidence = options.confidence ?? 0;

  if (!cleaned) {
    return { type: 'UNKNOWN', confirmed: false, confidence };
  }

  const exact = findExactCommand(cleaned);
  if (exact) {
    const confirmed = Boolean(options.isFinal) && !isCommandPrefixOnly(cleaned) && confidenceAllowsConfirm(confidence);
    return {
      type: exact.type,
      confirmed,
      confidence,
      matchedPhrase: exact.phrase,
      prefixOnly: false,
    };
  }

  if (isCommandPrefixOnly(cleaned) && !hasMathContent(cleaned, options.previousLexeme, options.hasEquals)) {
    return {
      type: 'COMMAND_CANDIDATE',
      confirmed: false,
      confidence,
      matchedPhrase: cleaned,
      prefixOnly: true,
    };
  }

  const trailing = findTrailingCommand(cleaned);
  if (trailing.command) {
    const confirmed =
      Boolean(options.isFinal) && !trailing.prefixOnly && confidenceAllowsConfirm(confidence);
    return {
      type: trailing.command.type,
      confirmed,
      confidence,
      matchedPhrase: trailing.command.phrase,
      mathText: trailing.mathText || undefined,
      prefixOnly: false,
    };
  }

  if (trailing.prefixOnly) {
    return {
      type: trailing.mathText ? 'MATH_CONTENT' : 'COMMAND_CANDIDATE',
      confirmed: false,
      confidence,
      matchedPhrase: cleaned.split(' ').pop(),
      mathText: trailing.mathText || undefined,
      prefixOnly: true,
    };
  }

  if (hasMathContent(cleaned, options.previousLexeme, options.hasEquals)) {
    return {
      type: 'MATH_CONTENT',
      confirmed: false,
      confidence,
      mathText: cleaned,
    };
  }

  return { type: 'UNKNOWN', confirmed: false, confidence };
}

export function isExecutableCommand(type: VoiceIntentType): boolean {
  return (
    type === 'SOLVE_COMMAND' ||
    type === 'CLEAR_COMMAND' ||
    type === 'UNDO_COMMAND' ||
    type === 'REDO_COMMAND' ||
    type === 'EXPLAIN_COMMAND' ||
    type === 'READ_ALOUD_COMMAND' ||
    type === 'STOP_COMMAND' ||
    type === 'NEXT_STEP_COMMAND' ||
    type === 'PREVIOUS_STEP_COMMAND' ||
    type === 'CHECK_ANSWER_COMMAND'
  );
}
