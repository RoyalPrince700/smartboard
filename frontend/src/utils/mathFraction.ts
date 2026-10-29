export interface TextSegment {
  type: 'text' | 'fraction';
  text?: string;
  numerator?: string;
  denominator?: string;
}

export const FRACTION_PATTERN = /\[FRAC:([^:\]]+):([^\]]+)\]/g;

export function formatFractionMarker(numerator: string | number, denominator: string | number): string {
  return `[FRAC:${numerator}:${denominator}]`;
}

export function parseMathSegments(input: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(FRACTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: 'text', text: input.slice(lastIndex, index) });
    }
    segments.push({
      type: 'fraction',
      numerator: match[1],
      denominator: match[2],
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', text: input.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', text: input });
  }

  return segments;
}

/** @deprecated Use parseMathSegments */
export function parseFractionSegments(input: string): TextSegment[] {
  return parseMathSegments(input);
}

export function stripFractionMarkers(input: string): string {
  return input.replace(FRACTION_PATTERN, (_, num: string, den: string) => `${num}/${den}`);
}

/** Split text for wrapping while keeping fraction markers intact. */
export function tokenizeForWrap(text: string): string[] {
  const tokens: string[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(FRACTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push(...text.slice(lastIndex, index).split(/\s+/).filter(Boolean));
    }
    tokens.push(match[0]);
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push(...text.slice(lastIndex).split(/\s+/).filter(Boolean));
  }

  return tokens.length > 0 ? tokens : [''];
}
