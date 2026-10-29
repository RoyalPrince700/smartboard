import type { TermCancellation } from '../types/equationAnnotation';

export interface EquationToken {
  id: string;
  text: string;
  side: 'left' | 'right';
  sideIndex: number;
}

function normalizeTerm(term: string): string {
  return term.replace(/\s+/g, ' ').trim();
}

function normalizeSignedToken(raw: string): string {
  const t = raw.trim();
  if (/^[+-]\s/.test(t)) return t;
  if (/^-[a-zA-Z0-9]/.test(t)) return `- ${t.slice(1)}`;
  if (/^-\d/.test(t)) return `- ${t.slice(1)}`;
  if (/^\+[a-zA-Z0-9]/.test(t)) return `+ ${t.slice(1)}`;
  if (/^\+\d/.test(t)) return `+ ${t.slice(1)}`;
  return t;
}

function tokenizeSide(side: 'left' | 'right', expression: string): EquationToken[] {
  const tokens: EquationToken[] = [];
  const pattern =
    /(\[FRAC:[^\]]+\])|(\([^)]+\))|((?:\+|-)\s*(?:\d+(?:\.\d+)?[a-zA-Z]?|[a-zA-Z]\d*|\d+(?:\.\d+)?))|(\d+[a-zA-Z]|[a-zA-Z]\d*|\d+(?:\.\d+)?)/g;

  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = pattern.exec(expression)) !== null) {
    const raw = match[0];
    if (!raw.trim()) continue;
    tokens.push({
      id: `${side}-${idx}`,
      text: normalizeSignedToken(raw),
      side,
      sideIndex: idx,
    });
    idx += 1;
  }

  return tokens;
}

export function parseEquationTokens(equation: string): {
  left: EquationToken[];
  right: EquationToken[];
} {
  let text = equation.trim();
  if (text.startsWith('→')) text = text.slice(1).trim();
  const eqIdx = text.indexOf('=');
  if (eqIdx === -1) {
    return { left: [], right: [] };
  }

  return {
    left: tokenizeSide('left', text.slice(0, eqIdx).trim()),
    right: tokenizeSide('right', text.slice(eqIdx + 1).trim()),
  };
}

export function resolveCancellationToken(
  tokens: EquationToken[],
  cancellation: TermCancellation
): EquationToken | undefined {
  const target = normalizeTerm(cancellation.term);
  const matches = tokens.filter((token) => normalizeTerm(token.text) === target);
  if (matches.length === 0) return undefined;

  const match = cancellation.match ?? 'first';
  if (match === 'last') return matches[matches.length - 1];
  if (match === 'first') return matches[0];
  return matches[match];
}

export function resolveCancellationTokens(
  equation: string,
  cancellations: TermCancellation[] | undefined
): Array<{ cancellation: TermCancellation; token: EquationToken }> {
  if (!cancellations?.length) return [];

  const { left, right } = parseEquationTokens(equation);
  const resolved: Array<{ cancellation: TermCancellation; token: EquationToken }> = [];
  const usedTokenIds = new Set<string>();

  for (const cancellation of cancellations) {
    const pool = cancellation.side === 'left' ? left : right;
    const token = resolveCancellationToken(pool, cancellation);
    if (!token || usedTokenIds.has(token.id)) continue;
    usedTokenIds.add(token.id);
    resolved.push({ cancellation, token });
  }

  return resolved;
}
