import type { MathStep } from '../types/math';

const LEADING_PROSE_PREFIX =
  /^(So|Therefore|Hence|Thus|Then)\s+(?=[\d([\\]|[a-zA-Z])/i;

/** Preserve readable spacing before math when a line starts with prose like "So" or "Therefore". */
export function wrapLeadingProseToLatex(text: string): string {
  return text.replace(LEADING_PROSE_PREFIX, (_, word: string) => `\\text{${word} }`);
}

/** Convert caret exponent notation (2^4, 2^(x+1)) into LaTeX superscripts (2^{4}, 2^{x+1}). */
export function convertExponentsToLatex(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '^') {
      let exponent = '';
      i += 1;

      if (text[i] === '(') {
        let depth = 1;
        i += 1;
        while (i < text.length && depth > 0) {
          if (text[i] === '(') depth += 1;
          else if (text[i] === ')') depth -= 1;
          if (depth > 0) exponent += text[i];
          i += 1;
        }
      } else {
        while (i < text.length && /[a-zA-Z0-9.]/.test(text[i])) {
          exponent += text[i];
          i += 1;
        }
      }

      result += `^{${exponent}}`;
      continue;
    }

    result += text[i];
    i += 1;
  }

  return result;
}

export function normalizeSignedTerms(expression: string): string {
  return expression
    .replace(/\+\s*-\s*([^+\-=→]+)/g, (_, term: string) => `+ (-${term.trim()})`)
    .replace(/-\s*-\s*([^+\-=→]+)/g, (_, term: string) => `- (-${term.trim()})`);
}

const PROSE_WORD_PATTERN =
  /\b(this|that|these|the|then|when|where|which|while|with|will|would|we|you|your|from|into|after|before|both|each|every|other|only|also|because|gives|give|form|left|right|side|sides|unknown|unknowns|variable|variables|method|eliminate|elimination|substitute|substitution|multiply|multiplying|divide|dividing|move|replace|adding|subtracting|removes|leaving|single|equations?|standard|rearrange|coefficients?|constants?|terms?|cancel|cancels|cancelled|match|matches|check|verify|remaining|known|size|opposite|sign|equal|equals|first|second|next|now|use|using|means|should|look|becomes|compare|calculate|there|are|is|has|have|find|shows|show|write|identify|choose|evaluate|isolate|solution|answers?|problem|result|whole|entire|same|different|together|separately|but|and|for|not|all|any|per|by|of|in|on|at|to|as|an|a|so|if|can|must|number|value|less|greater|than|roots?|what|how|why|make|makes|need|needs|help|helps|work|works|true|out|over|under|between|through|without|within|around|against|among|inside|outside|toward|upon|once|again|still|just|even|already|yet|here|everywhere|always|never|sometimes|often|usually|really|very|quite|too|much|many|more|most|few|little|enough|almost|nearly|about|exactly|simply|clearly|directly|instead|either|neither|nor|plus|minus|times|back|forward|apart|along|across|beyond|behind|above|below|beside|besides|near|close|during|since|until|although|though|unless|whether|no|yes|well|right|wrong|correct|incorrect|possible|likely|sure|maybe|perhaps|probably|definitely|certainly|absolutely|approximately|roughly|finally|initially|previously|currently|recently|soon|later|earlier|before|after|during|while|when|where|why|how|what|which|who|whom|whose|that|this|these|those|here|there|everywhere|always|never|sometimes|often|usually)\b/i;

function isProseLine(line: string): boolean {
  if (/^[•\-–—]/.test(line)) return true;
  if (/\bterms?:\s/i.test(line)) return true;
  if (/^constants?:\s/i.test(line)) return true;
  if (PROSE_WORD_PATTERN.test(line)) return true;
  if (/(?:\b[a-z]{4,}\b\s+){2,}/i.test(line)) return true;
  return false;
}

function isStandaloneMathLine(line: string): boolean {
  return (
    /^[+-]?\d+(?:\.\d+)?$/.test(line) ||
    /^×\s*[+-]?\d+(?:\.\d+)?$/.test(line) ||
    /^Equation\s+\d+:/i.test(line)
  );
}

function looksLikeMathLine(line: string): boolean {
  const trimmed = line.replace(/^→\s*/, '').trim();
  return (
    /^[\d([\\[]/.test(trimmed) ||
    /^\[FRAC:/.test(trimmed) ||
    /^[+-]?\d*[a-zA-Z]/.test(trimmed) ||
    /^=\s*[\d([+-]/.test(trimmed)
  );
}

export function isEquationLine(line: string): boolean {
  if (isStandaloneMathLine(line)) return true;
  if (isProseLine(line)) return false;
  if (!/[=→×]|\[FRAC:/.test(line)) return false;
  return looksLikeMathLine(line);
}

export function cleanEquationLine(line: string): string {
  const normalized = normalizeSignedTerms(
    line
      .replace(/^Standard form:\s*/i, '')
      .replace(/^Equation\s+\d+:\s*/i, '')
      .replace(/^→\s*/, '→ ')
      .trim()
  );

  if (/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) return normalized;
  if (/^×\s*/.test(normalized)) return normalized;

  const parts = normalized
    .split('→')
    .map((part) => part.trim())
    .filter(Boolean);

  const mathParts = parts.filter(
    (part) =>
      part.includes('=') ||
      part.includes('[FRAC:') ||
      (/^[\d([{+\-]/.test(part) && /[\d+\-×÷*/]/.test(part))
  );

  return mathParts.length > 0 ? mathParts.join(' → ') : normalized;
}

export function splitStepContent(content: string): {
  explanation?: string;
  equations: string[];
} {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const explanations = lines.filter((line) => !isEquationLine(line));
  const equations = lines.filter(isEquationLine).map(cleanEquationLine);

  return {
    explanation: explanations.join('\n') || undefined,
    equations,
  };
}

/** Pick the main equation/formula shown in a step for the reference navigator. */
export function getStepReferenceFormula(step: MathStep): {
  formula: string;
  latex?: string;
} {
  if (step.annotatedEquations?.length) {
    const last = step.annotatedEquations[step.annotatedEquations.length - 1];
    return { formula: last.text, latex: step.latex };
  }

  const parsed = splitStepContent(step.content);
  if (parsed.equations.length > 0) {
    const last = parsed.equations[parsed.equations.length - 1];
    return { formula: last, latex: step.latex };
  }

  if (step.latex) {
    const firstLine = step.content.split('\n').map((line) => line.trim()).find(Boolean);
    return { formula: firstLine ?? step.title, latex: step.latex };
  }

  const equationLine = step.content
    .split('\n')
    .map((line) => line.trim())
    .find(isEquationLine);

  return { formula: equationLine ?? step.title };
}

export function tokenizeEquation(expression: string): string[] {
  const normalized = normalizeSignedTerms(expression);
  return (
    normalized.match(/\[FRAC:[^\]]+\]|\(-[^)]+\)|→|÷|×|=|\+|-|[^+\-=→÷×\s]+/g) ?? [
      normalized,
    ]
  );
}
