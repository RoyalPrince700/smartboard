/**
 * Deterministic probability solver for typed and spoken JSS/SS questions.
 */

import { MathStep } from '../../types/math';
import { formatNumber } from './EquationParser';

export type ProbabilityKind =
  | 'basic_ratio'
  | 'bag_draw'
  | 'die'
  | 'coin'
  | 'complement'
  | 'independent_and'
  | 'mutually_exclusive_or'
  | 'general_or'
  | 'combination'
  | 'permutation';

export interface ProbabilitySolveResult {
  steps: MathStep[];
  answers: string[];
  graphable: false;
  kind: ProbabilityKind;
  fraction?: { numerator: number; denominator: number };
  decimal?: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function simplifyFraction(n: number, d: number): { numerator: number; denominator: number } {
  if (d === 0) return { numerator: n, denominator: d };
  const g = gcd(n, d);
  return { numerator: n / g, denominator: d / g };
}

function formatFraction(n: number, d: number): string {
  const s = simplifyFraction(n, d);
  if (s.denominator === 1) return String(s.numerator);
  return `${s.numerator}/${s.denominator}`;
}

function parseNumberToken(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/,/g, '');
  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
  };
  if (words[t] !== undefined) return words[t];
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Factorial requires a non-negative integer');
  if (n > 170) throw new Error('Factorial too large');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function combination(n: number, r: number): number {
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid combination inputs');
  if (r === 0 || r === n) return 1;
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result);
}

function permutation(n: number, r: number): number {
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid permutation inputs');
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

function answerFromFraction(n: number, d: number): { answers: string[]; fraction: { numerator: number; denominator: number }; decimal: number } {
  const s = simplifyFraction(n, d);
  const decimal = s.numerator / s.denominator;
  const frac = formatFraction(s.numerator, s.denominator);
  const answers = [`P = ${frac}`];
  if (s.denominator !== 1) {
    answers.push(`P ≈ ${formatNumber(decimal)}`);
  }
  return { answers, fraction: s, decimal };
}

function normalizeProbabilityText(input: string): string {
  return input
    .trim()
    .replace(/[’']/g, "'")
    .replace(/\u2212|–|—/g, '-')
    .replace(/\s+/g, ' ');
}

/** Detect probability-looking prompts (typed or spoken). */
export function looksLikeProbability(input: string): boolean {
  const text = input.toLowerCase();
  return (
    /\bprobabilit(?:y|ies)\b/.test(text) ||
    /\bchance\b/.test(text) ||
    /\blikelihood\b/.test(text) ||
    /\bcomplement(?:ary)?\b/.test(text) ||
    /\bmutually\s+exclusive\b/.test(text) ||
    /\bindependent\s+events?\b/.test(text) ||
    /\bcombinat(?:ion|ions)\b|\bnCr\b|\bchoose\b/i.test(input) ||
    /\bpermutat(?:ion|ions)\b|\bnPr\b/i.test(input) ||
    /\bP\s*\(\s*[^)]+\s*\)/.test(input) ||
    /\b[CP]\s*\(\s*\d+\s*,\s*\d+\s*\)/.test(input) ||
    /\b\d+\s*[CP]\s*\d+\b/.test(input) ||
    (/\b(?:die|dice|coin|bag|balls?|marbles?|cards?)\b/.test(text) &&
      /\b(?:probabilit|chance|pick|draw|roll|toss|select)\b/.test(text))
  );
}

function tryParseCombination(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);
  const patterns = [
    /\bC\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i,
    /\b(\d+)\s*C\s*(\d+)\b/i,
    /\b(\d+)\s+choose\s+(\d+)\b/i,
    /\bcombinat(?:ion|ions)\s+(?:of\s+)?(\d+)\s+(?:taken\s+)?(?:from\s+)?(\d+)\b/i,
    /\b(?:ways?\s+to\s+)?(?:choose|select|pick)\s+(\d+)\s+(?:\w+\s+){0,3}from\s+(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    let n = Number(m[1]);
    let r = Number(m[2]);
    // "combinations of r from n" sometimes reversed in spoken forms
    if (/combinat/i.test(m[0]) && /from/i.test(text) && n < r) {
      [n, r] = [r, n];
    }
    if (/choose|select|pick/i.test(m[0]) && pattern.source.includes('from')) {
      r = Number(m[1]);
      n = Number(m[2]);
    }
    const value = combination(n, r);
    const steps: MathStep[] = [
      {
        step: 1,
        title: 'Identify the combination',
        content: `We need ${n}C${r} (choose ${r} from ${n}).\nFormula: nCr = n! / (r!(n-r)!)`,
        latex: `\\mathrm{C}(${n},${r}) = \\frac{${n}!}{${r}!(${n}-${r})!}`,
      },
      {
        step: 2,
        title: 'Substitute the values',
        content: `${n}C${r} = ${n}! / (${r}! × ${n - r}!)`,
      },
      {
        step: 3,
        title: 'Calculate',
        content: `${n}C${r} = ${formatNumber(value)}`,
        latex: `\\mathrm{C}(${n},${r}) = ${value}`,
      },
    ];
    return {
      steps,
      answers: [`${n}C${r} = ${formatNumber(value)}`],
      graphable: false,
      kind: 'combination',
    };
  }
  return null;
}

function tryParsePermutation(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);
  const patterns = [
    /\bP\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
    /\b(\d+)\s*P\s*(\d+)\b/,
    /\bpermutat(?:ion|ions)\s+(?:of\s+)?(\d+)\s+(?:taken\s+)?(?:from\s+)?(\d+)\b/i,
    /\barrange\s+(\d+)\s+(?:\w+\s+){0,3}from\s+(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    // Avoid treating P(event) as permutation: require digits only which patterns already do
    let n = Number(m[1]);
    let r = Number(m[2]);
    if (/arrange/i.test(m[0])) {
      r = Number(m[1]);
      n = Number(m[2]);
    }
    const value = permutation(n, r);
    const steps: MathStep[] = [
      {
        step: 1,
        title: 'Identify the permutation',
        content: `We need ${n}P${r} (arrange ${r} from ${n}).\nFormula: nPr = n! / (n-r)!`,
        latex: `\\mathrm{P}(${n},${r}) = \\frac{${n}!}{(${n}-${r})!}`,
      },
      {
        step: 2,
        title: 'Substitute the values',
        content: `${n}P${r} = ${n}! / ${n - r}!`,
      },
      {
        step: 3,
        title: 'Calculate',
        content: `${n}P${r} = ${formatNumber(value)}`,
        latex: `\\mathrm{P}(${n},${r}) = ${value}`,
      },
    ];
    return {
      steps,
      answers: [`${n}P${r} = ${formatNumber(value)}`],
      graphable: false,
      kind: 'permutation',
    };
  }
  return null;
}

function extractNamedProbability(text: string, names: string[]): number | null {
  for (const name of names) {
    const patterns = [
      new RegExp(`P\\s*\\(\\s*${name}\\s*\\)\\s*=\\s*([\\d./]+)`, 'i'),
      new RegExp(`probability\\s+of\\s+${name}\\s*(?:is|=)\\s*([\\d./]+)`, 'i'),
      new RegExp(`${name}\\s*=\\s*([\\d./]+)`, 'i'),
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const v = parseNumberToken(m[1]);
        if (v !== null) return v;
      }
    }
  }
  return null;
}

function tryParseComplement(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);
  if (!/not\b|complement|P\s*\(\s*A'\s*\)|P\s*\(\s*A\^c\s*\)|P\s*\(\s*[^)]+\s*'\s*\)/i.test(text)) {
    return null;
  }

  const p =
    extractNamedProbability(text, ['A', 'E', 'event']) ??
    (() => {
      const m = text.match(/P\s*\(\s*[A-Za-z]\s*\)\s*=\s*([\d./]+)/i);
      return m ? parseNumberToken(m[1]) : null;
    })();

  if (p === null || p < 0 || p > 1) return null;

  const complement = 1 - p;
  const asFraction =
    Math.abs(p * 1000 - Math.round(p * 1000)) < 1e-8
      ? simplifyFraction(Math.round(p * 1000), 1000)
      : null;

  const steps: MathStep[] = [
    {
      step: 1,
      title: 'Recall the complement rule',
      content: `P(not A) = 1 − P(A)\nThe complement covers every outcome that is not A.`,
      latex: `P(A') = 1 - P(A)`,
    },
    {
      step: 2,
      title: 'Substitute',
      content: `P(A) = ${formatNumber(p)}\nP(not A) = 1 − ${formatNumber(p)}`,
    },
    {
      step: 3,
      title: 'Calculate',
      content: `P(not A) = ${formatNumber(complement)}`,
      latex: `P(A') = ${formatNumber(complement)}`,
    },
  ];

  const answers = [`P(not A) = ${formatNumber(complement)}`];
  if (asFraction && asFraction.denominator !== 1) {
    const c = simplifyFraction(asFraction.denominator - asFraction.numerator, asFraction.denominator);
    answers.unshift(`P(not A) = ${formatFraction(c.numerator, c.denominator)}`);
  }

  return {
    steps,
    answers,
    graphable: false,
    kind: 'complement',
    decimal: complement,
  };
}

function tryParseAndOr(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);
  const pA = extractNamedProbability(text, ['A']);
  const pB = extractNamedProbability(text, ['B']);
  if (pA === null || pB === null) return null;

  const wantsAnd = /\band\b|intersection|P\s*\(\s*A\s*[∩&]\s*B\s*\)|A\s+and\s+B/i.test(text);
  const wantsOr = /\bor\b|union|P\s*\(\s*A\s*[∪|]\s*B\s*\)|A\s+or\s+B/i.test(text);
  const independent = /\bindependent\b/i.test(text);
  const mutuallyExclusive = /\bmutually\s+exclusive\b|\bdisjoint\b/i.test(text);
  const pBoth = extractNamedProbability(text, ['A and B', 'A∩B', 'A&B']);

  if (wantsAnd && (independent || /\bindependent\b/i.test(text) || !wantsOr)) {
    if (!independent && pBoth === null && !/\band\b/i.test(text)) return null;
    if (independent || wantsAnd) {
      const value = pA * pB;
      const steps: MathStep[] = [
        {
          step: 1,
          title: 'Use the independent-events rule',
          content: `For independent events:\nP(A and B) = P(A) × P(B)`,
          latex: `P(A \\cap B) = P(A)\\times P(B)`,
        },
        {
          step: 2,
          title: 'Substitute',
          content: `P(A) = ${formatNumber(pA)}, P(B) = ${formatNumber(pB)}\nP(A and B) = ${formatNumber(pA)} × ${formatNumber(pB)}`,
        },
        {
          step: 3,
          title: 'Calculate',
          content: `P(A and B) = ${formatNumber(value)}`,
          latex: `P(A \\cap B) = ${formatNumber(value)}`,
        },
      ];
      return {
        steps,
        answers: [`P(A and B) = ${formatNumber(value)}`],
        graphable: false,
        kind: 'independent_and',
        decimal: value,
      };
    }
  }

  if (wantsOr && mutuallyExclusive) {
    const value = pA + pB;
    const steps: MathStep[] = [
      {
        step: 1,
        title: 'Use the mutually exclusive rule',
        content: `For mutually exclusive events:\nP(A or B) = P(A) + P(B)`,
        latex: `P(A \\cup B) = P(A)+P(B)`,
      },
      {
        step: 2,
        title: 'Substitute',
        content: `P(A) = ${formatNumber(pA)}, P(B) = ${formatNumber(pB)}\nP(A or B) = ${formatNumber(pA)} + ${formatNumber(pB)}`,
      },
      {
        step: 3,
        title: 'Calculate',
        content: `P(A or B) = ${formatNumber(value)}`,
        latex: `P(A \\cup B) = ${formatNumber(value)}`,
      },
    ];
    return {
      steps,
      answers: [`P(A or B) = ${formatNumber(value)}`],
      graphable: false,
      kind: 'mutually_exclusive_or',
      decimal: value,
    };
  }

  if (wantsOr && pBoth !== null) {
    const value = pA + pB - pBoth;
    const steps: MathStep[] = [
      {
        step: 1,
        title: 'Use the general addition rule',
        content: `P(A or B) = P(A) + P(B) − P(A and B)`,
        latex: `P(A \\cup B) = P(A)+P(B)-P(A \\cap B)`,
      },
      {
        step: 2,
        title: 'Substitute',
        content:
          `P(A) = ${formatNumber(pA)}, P(B) = ${formatNumber(pB)}, P(A and B) = ${formatNumber(pBoth)}\n` +
          `P(A or B) = ${formatNumber(pA)} + ${formatNumber(pB)} − ${formatNumber(pBoth)}`,
      },
      {
        step: 3,
        title: 'Calculate',
        content: `P(A or B) = ${formatNumber(value)}`,
        latex: `P(A \\cup B) = ${formatNumber(value)}`,
      },
    ];
    return {
      steps,
      answers: [`P(A or B) = ${formatNumber(value)}`],
      graphable: false,
      kind: 'general_or',
      decimal: value,
    };
  }

  return null;
}

function tryParseBasicRatio(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);

  const outOf = text.match(
    /(?:probability|chance|P)\b[^0-9]{0,40}?(\d+)\s*(?:out\s+of|\/)\s*(\d+)/i
  );
  if (outOf) {
    const fav = Number(outOf[1]);
    const total = Number(outOf[2]);
    if (total > 0 && fav >= 0) {
      return buildBasicRatioSteps(fav, total, 'favorable outcomes', 'total possible outcomes');
    }
  }

  const favTotal = text.match(
    /favorable[^0-9]{0,20}(\d+)[^0-9]{0,40}(?:total|sample\s*space|possible)[^0-9]{0,20}(\d+)/i
  );
  if (favTotal) {
    return buildBasicRatioSteps(Number(favTotal[1]), Number(favTotal[2]), 'favorable outcomes', 'total outcomes');
  }

  const slash = text.match(/\bP\s*(?:\(|=)?\s*(\d+)\s*\/\s*(\d+)/i);
  if (slash) {
    return buildBasicRatioSteps(Number(slash[1]), Number(slash[2]), 'favorable outcomes', 'total outcomes');
  }

  return null;
}

function buildBasicRatioSteps(
  favorable: number,
  total: number,
  favLabel: string,
  totalLabel: string
): ProbabilitySolveResult {
  const { answers, fraction, decimal } = answerFromFraction(favorable, total);
  const steps: MathStep[] = [
    {
      step: 1,
      title: 'Recall the probability formula',
      content: `P(event) = number of favorable outcomes ÷ total number of possible outcomes`,
      latex: `P(E) = \\frac{n(E)}{n(S)}`,
    },
    {
      step: 2,
      title: 'Identify the counts',
      content: `${favLabel} = ${favorable}\n${totalLabel} = ${total}`,
    },
    {
      step: 3,
      title: 'Calculate',
      content: `P = ${favorable}/${total} = ${formatFraction(fraction.numerator, fraction.denominator)}`,
      latex: `P = \\frac{${fraction.numerator}}{${fraction.denominator}}`,
    },
  ];
  return { steps, answers, graphable: false, kind: 'basic_ratio', fraction, decimal };
}

function tryParseBag(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input);
  if (!/\b(?:bag|box|urn|marbles?|balls?)\b/i.test(text)) return null;

  const counts: Array<{ color: string; count: number }> = [];
  const colorPattern =
    /(\d+)\s*(red|blue|green|yellow|white|black|pink|orange|purple|brown|grey|gray|marbles?|balls?)/gi;
  let m: RegExpExecArray | null;
  while ((m = colorPattern.exec(text)) !== null) {
    const count = Number(m[1]);
    let color = m[2].toLowerCase();
    if (color.startsWith('ball') || color.startsWith('marble')) continue;
    counts.push({ color, count });
  }

  if (counts.length === 0) return null;
  const total = counts.reduce((s, c) => s + c.count, 0);

  const targetMatch =
    text.match(
      /(?:probability|chance|pick(?:ing)?|draw(?:ing)?|select(?:ing)?|getting|of)\s+(?:\w+\s+){0,6}?(red|blue|green|yellow|white|black|pink|orange|purple|brown|grey|gray)\b/i
    ) ?? text.match(/\b(red|blue|green|yellow|white|black|pink|orange|purple|brown|grey|gray)\b/i);
  const target = targetMatch?.[1]?.toLowerCase();
  if (!target) return null;

  const found = counts.find((c) => c.color === target);
  if (!found) return null;

  const result = buildBasicRatioSteps(found.count, total, `${target} items`, 'total items in the bag');
  result.kind = 'bag_draw';
  result.steps[0] = {
    step: 1,
    title: 'List the sample space',
    content:
      counts.map((c) => `${c.count} ${c.color}`).join(', ') +
      `\nTotal items = ${total}`,
  };
  result.steps[1] = {
    step: 2,
    title: 'Count favorable outcomes',
    content: `Favorable (${target}) = ${found.count}`,
  };
  result.steps[2] = {
    step: 3,
    title: 'Apply P = favorable ÷ total',
    content: `P(${target}) = ${found.count}/${total} = ${formatFraction(result.fraction!.numerator, result.fraction!.denominator)}`,
    latex: `P(\\text{${target}}) = \\frac{${result.fraction!.numerator}}{${result.fraction!.denominator}}`,
  };
  result.answers = [`P(${target}) = ${formatFraction(result.fraction!.numerator, result.fraction!.denominator)}`];
  if (result.fraction!.denominator !== 1) {
    result.answers.push(`P(${target}) ≈ ${formatNumber(result.decimal!)}`);
  }
  return result;
}

function tryParseDie(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input).toLowerCase();
  if (!/\b(?:die|dice)\b/.test(text)) return null;

  const faces = 6;
  let favorable = 0;
  let label = '';

  if (/\beven\b/.test(text)) {
    favorable = 3;
    label = 'even number (2, 4, 6)';
  } else if (/\bodd\b/.test(text)) {
    favorable = 3;
    label = 'odd number (1, 3, 5)';
  } else if (/greater\s+than\s+(\d+)/.test(text)) {
    const n = Number(text.match(/greater\s+than\s+(\d+)/)![1]);
    favorable = [1, 2, 3, 4, 5, 6].filter((x) => x > n).length;
    label = `number greater than ${n}`;
  } else if (/less\s+than\s+(\d+)/.test(text)) {
    const n = Number(text.match(/less\s+than\s+(\d+)/)![1]);
    favorable = [1, 2, 3, 4, 5, 6].filter((x) => x < n).length;
    label = `number less than ${n}`;
  } else if (/at\s+least\s+(\d+)/.test(text)) {
    const n = Number(text.match(/at\s+least\s+(\d+)/)![1]);
    favorable = [1, 2, 3, 4, 5, 6].filter((x) => x >= n).length;
    label = `number at least ${n}`;
  } else {
    const face = text.match(/(?:rolling|getting|of)\s+(?:a\s+|an\s+)?([1-6])\b/);
    if (face) {
      favorable = 1;
      label = face[1];
    } else {
      return null;
    }
  }

  const result = buildBasicRatioSteps(favorable, faces, label, 'faces on a fair die');
  result.kind = 'die';
  result.answers = [`P(${label}) = ${formatFraction(result.fraction!.numerator, result.fraction!.denominator)}`];
  return result;
}

function tryParseCoin(input: string): ProbabilitySolveResult | null {
  const text = normalizeProbabilityText(input).toLowerCase();
  if (!/\bcoins?\b/.test(text)) return null;

  const tossesMatch = text.match(/(\d+)\s*(?:times|tosses|coins?)/);
  const tosses = tossesMatch ? Number(tossesMatch[1]) : /\btwice\b/.test(text) ? 2 : 1;

  if (tosses === 1) {
    if (/\bheads?\b/.test(text) || /\btails?\b/.test(text)) {
      const side = /\bheads?\b/.test(text) ? 'heads' : 'tails';
      const result = buildBasicRatioSteps(1, 2, side, 'outcomes on a fair coin');
      result.kind = 'coin';
      result.answers = [`P(${side}) = 1/2`];
      return result;
    }
    return null;
  }

  if (tosses > 8) return null;
  const total = 2 ** tosses;

  let favorable = 0;
  let label = '';
  if (/all\s+heads|both\s+heads|two\s+heads|heads?\s+only/.test(text)) {
    favorable = 1;
    label = `${tosses} heads`;
  } else if (/all\s+tails|both\s+tails|two\s+tails|tails?\s+only/.test(text)) {
    favorable = 1;
    label = `${tosses} tails`;
  } else if (/exactly\s+(\d+)\s+heads/.test(text)) {
    const k = Number(text.match(/exactly\s+(\d+)\s+heads/)![1]);
    favorable = combination(tosses, k);
    label = `exactly ${k} heads`;
  } else if (/one\s+head\s+and\s+one\s+tail|different\s+faces|head\s+and\s+tail/.test(text) && tosses === 2) {
    favorable = 2;
    label = 'one head and one tail';
  } else {
    return null;
  }

  const result = buildBasicRatioSteps(favorable, total, label, `outcomes when tossing ${tosses} coin(s)`);
  result.kind = 'coin';
  result.answers = [`P(${label}) = ${formatFraction(result.fraction!.numerator, result.fraction!.denominator)}`];
  return result;
}

export function parseProbabilityInput(input: string): ProbabilityKind | null {
  if (!looksLikeProbability(input)) return null;
  if (tryParseCombination(input)) return 'combination';
  if (tryParsePermutation(input)) return 'permutation';
  if (tryParseComplement(input)) return 'complement';
  if (tryParseAndOr(input)) return 'independent_and'; // kind refined in solve
  if (tryParseBag(input)) return 'bag_draw';
  if (tryParseDie(input)) return 'die';
  if (tryParseCoin(input)) return 'coin';
  if (tryParseBasicRatio(input)) return 'basic_ratio';
  return null;
}

export function solveProbability(input: string): ProbabilitySolveResult {
  const trimmed = normalizeProbabilityText(input);

  const solvers = [
    tryParseCombination,
    tryParsePermutation,
    tryParseComplement,
    tryParseAndOr,
    tryParseBag,
    tryParseDie,
    tryParseCoin,
    tryParseBasicRatio,
  ];

  for (const solve of solvers) {
    const result = solve(trimmed);
    if (result) return result;
  }

  throw new Error(
    'Could not parse probability question. Try forms like: "A bag has 5 red and 3 blue balls. Probability of red?", "P(A)=0.3 find P(not A)", "C(10,3)", or "probability of rolling an even number on a die".'
  );
}
