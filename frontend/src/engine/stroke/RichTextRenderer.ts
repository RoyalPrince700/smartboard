import { TextSegment, parseFractionSegments } from '../../utils/mathFraction';

export interface RichTextMetrics {
  width: number;
  height: number;
  fontSize: number;
}

function getFont(strokeWidth: number): string {
  return `${strokeWidth * 8}px sans-serif`;
}

export function measureSegmentWidth(
  ctx: CanvasRenderingContext2D,
  segment: TextSegment
): number {
  if (segment.type === 'text') {
    return ctx.measureText(segment.text ?? '').width;
  }

  const numWidth = ctx.measureText(segment.numerator ?? '').width;
  const denWidth = ctx.measureText(segment.denominator ?? '').width;
  return Math.max(numWidth, denWidth) + 10;
}

export function measureRichTextWidth(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[]
): number {
  return segments.reduce((total, segment) => total + measureSegmentWidth(ctx, segment), 0);
}

export function measureRichTextHeight(fontSize: number): number {
  return fontSize * 2.15;
}

export function estimateRichTextWidth(text: string, fontSize: number): number {
  const plain = text.replace(/\[FRAC:[^:\]]+:[^:\]]+\]/g, (match) => {
    const parts = match.match(/\[FRAC:([^:\]]+):([^:\]]+)\]/);
    if (!parts) return match;
    return `${parts[1]}/${parts[2]}`;
  });
  return plain.length * fontSize * 0.58;
}

export function drawRichTextLine(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  x: number,
  baselineY: number,
  fontSize: number,
  color: string,
  strokeWidth: number
): RichTextMetrics {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.font = getFont(strokeWidth);
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(1, fontSize * 0.06);

  let cursorX = x;
  const barY = baselineY - fontSize * 0.35;

  for (const segment of segments) {
    if (segment.type === 'text') {
      ctx.textAlign = 'left';
      ctx.fillText(segment.text ?? '', cursorX, baselineY);
      cursorX += ctx.measureText(segment.text ?? '').width;
      continue;
    }

    const numerator = segment.numerator ?? '';
    const denominator = segment.denominator ?? '';
    const numWidth = ctx.measureText(numerator).width;
    const denWidth = ctx.measureText(denominator).width;
    const fracWidth = Math.max(numWidth, denWidth) + 10;
    const centerX = cursorX + fracWidth / 2;

    ctx.textAlign = 'center';
    ctx.fillText(numerator, centerX, barY - fontSize * 0.12);
    ctx.beginPath();
    ctx.moveTo(cursorX + 2, barY + fontSize * 0.08);
    ctx.lineTo(cursorX + fracWidth - 2, barY + fontSize * 0.08);
    ctx.stroke();
    ctx.fillText(denominator, centerX, barY + fontSize * 1.05);

    cursorX += fracWidth;
  }

  ctx.restore();

  return {
    width: cursorX - x,
    height: measureRichTextHeight(fontSize),
    fontSize,
  };
}

export function parseRichTextSegments(text: string): TextSegment[] {
  return parseFractionSegments(text);
}
