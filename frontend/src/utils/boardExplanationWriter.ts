import { estimateRichTextWidth, measureRichTextHeight } from '../engine/stroke/RichTextRenderer';
import { createPoint, startStroke } from '../engine/stroke/StrokeEngine';
import { TeachingResponse } from '../types/ai';
import { SolveResponse } from '../types/math';
import { AI_EXPLANATION_TAG, CanvasSettings, Stroke, TextSegment } from '../types/stroke';
import { parseFractionSegments, tokenizeForWrap } from './mathFraction';
import { rewriteMathQuestion, splitExplanationBlocks } from './rewriteQuestion';
import { useBoardStore } from '../stores/boardStore';

export type BoardLineStyle = 'title' | 'body' | 'answer' | 'step';

export interface BoardLine {
  text: string;
  style: BoardLineStyle;
  segments?: TextSegment[];
}

const STYLE_MAP: Record<BoardLineStyle, { width: number; color: string }> = {
  title: { width: 3.4, color: '#0f3460' },
  body: { width: 2.5, color: '#1a1a2e' },
  answer: { width: 3.2, color: '#e94560' },
  step: { width: 2.5, color: '#334155' },
};

const HORIZONTAL_PADDING = 20;
const TOP_PADDING = 36;
const LINE_SPACING = 1.55;
const GROUP_GAP = 16;
const CHAR_WIDTH_RATIO = 0.52;

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

function wrapRichText(text: string, maxWidth: number, fontSize: number): string[] {
  if (!text.trim()) return [''];

  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const tokens = tokenizeForWrap(paragraph.trim());
    let current = '';

    for (const token of tokens) {
      const candidate = current ? `${current} ${token}` : token;
      const width = estimateRichTextWidth(candidate, fontSize);

      if (width > maxWidth && current) {
        lines.push(current);
        current = token;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
    if (paragraph !== paragraphs[paragraphs.length - 1] && !current) {
      lines.push('');
    }
  }

  return lines.length > 0 ? lines : [''];
}

function pushWrappedLines(
  items: BoardLine[],
  text: string,
  style: BoardLineStyle,
  maxWidth: number,
  fontSize: number
): void {
  for (const line of wrapRichText(text, maxWidth, fontSize)) {
    items.push({
      text: line,
      style,
      segments: parseFractionSegments(line),
    });
  }
}

export function getBoardMaxChars(canvasWidth: number): number {
  const usableWidth = canvasWidth - HORIZONTAL_PADDING * 2;
  const fontSize = 2.5 * 8;
  return Math.max(32, Math.floor(usableWidth / (fontSize * CHAR_WIDTH_RATIO)));
}

export function getBoardTextWidth(canvasWidth: number): number {
  return canvasWidth - HORIZONTAL_PADDING * 2;
}

export function formatMathSolutionGroups(
  solution: SolveResponse,
  canvasWidth: number
): BoardLine[][] {
  const groups: BoardLine[][] = [];
  const maxWidth = getBoardTextWidth(canvasWidth);
  const fontSize = STYLE_MAP.step.width * 8;
  const question = rewriteMathQuestion(
    solution.recognizedInput || solution.normalizedInput || solution.equation || ''
  );

  if (question) {
    const group: BoardLine[] = [];
    pushWrappedLines(group, question, 'title', maxWidth, STYLE_MAP.title.width * 8);
    groups.push(group);
  }

  for (const step of solution.steps) {
    const group: BoardLine[] = [];
    pushWrappedLines(group, `${step.step}. ${step.title}`, 'step', maxWidth, fontSize);
    pushWrappedLines(group, step.content, 'step', maxWidth, fontSize);
    groups.push(group);
  }

  const answer: BoardLine[] = [];
  pushWrappedLines(answer, `Answer: ${solution.answer}`, 'answer', maxWidth, STYLE_MAP.answer.width * 8);
  groups.push(answer);

  return groups;
}

export function formatTeachingGroups(
  question: string,
  response: TeachingResponse,
  canvasWidth: number
): BoardLine[][] {
  const groups: BoardLine[][] = [];
  const maxWidth = getBoardTextWidth(canvasWidth);
  const bodyFontSize = STYLE_MAP.body.width * 8;
  const title: BoardLine[] = [];
  pushWrappedLines(title, stripMarkdown(question) || 'Explanation', 'title', maxWidth, STYLE_MAP.title.width * 8);
  groups.push(title);

  for (const block of splitExplanationBlocks(response.text)) {
    const group: BoardLine[] = [];
    pushWrappedLines(group, stripMarkdown(block), 'body', maxWidth, bodyFontSize);
    groups.push(group);
  }

  if (response.keyPoints?.length) {
    const group: BoardLine[] = [{ text: 'Key points:', style: 'step', segments: [{ type: 'text', text: 'Key points:' }] }];
    for (const point of response.keyPoints) {
      pushWrappedLines(group, `• ${stripMarkdown(point)}`, 'body', maxWidth, bodyFontSize);
    }
    groups.push(group);
  }

  return groups;
}

function appendLineStrokes(
  line: BoardLine,
  startX: number,
  cursorY: number,
  maxWidth: number,
  canvasHeight: number
): { strokes: Stroke[]; cursorY: number } {
  const { width, color } = STYLE_MAP[line.style];
  const fontSize = width * 8;
  const lineHeight = Math.max(fontSize * LINE_SPACING, measureRichTextHeight(fontSize));
  const strokes: Stroke[] = [];
  let y = cursorY;

  if (!line.text.trim()) {
    return { strokes, cursorY: y + lineHeight * 0.45 };
  }

  const wrappedLines =
    line.segments && line.segments.length > 0 && !line.text.includes('\n')
      ? [{ text: line.text, segments: line.segments }]
      : wrapRichText(line.text, maxWidth, fontSize).map((wrapped) => ({
          text: wrapped,
          segments: parseFractionSegments(wrapped),
        }));

  for (const wrapped of wrappedLines) {
    if (y + lineHeight > canvasHeight - 20) break;

    const segments = wrapped.segments ?? parseFractionSegments(wrapped.text);
    const textWidth = estimateRichTextWidth(wrapped.text, fontSize);
    const boundsHeight = measureRichTextHeight(fontSize);
    const baselineY = y + fontSize;

    strokes.push(
      startStroke({
        tool: 'text',
        color,
        width,
        point: createPoint(startX, baselineY),
        textContent: wrapped.text,
        textSegments: segments,
        shapeBounds: {
          x1: startX,
          y1: y,
          x2: startX + Math.min(textWidth, maxWidth),
          y2: baselineY + boundsHeight * 0.15,
        },
        tag: AI_EXPLANATION_TAG,
      })
    );
    y += lineHeight;
  }

  return { strokes, cursorY: y };
}

export function appendEquationToBoard(
  equation: string,
  canvasSettings: CanvasSettings
): void {
  const store = useBoardStore.getState();
  const existingStrokes = store.strokes;

  let cursorY = TOP_PADDING;
  for (const stroke of existingStrokes) {
    if (stroke.shapeBounds) {
      cursorY = Math.max(cursorY, stroke.shapeBounds.y2 + GROUP_GAP);
    }
  }

  const startX = HORIZONTAL_PADDING;
  const maxWidth = getBoardTextWidth(canvasSettings.width);
  const line: BoardLine = {
    text: equation,
    style: 'title',
    segments: parseFractionSegments(equation),
  };
  const { strokes } = appendLineStrokes(line, startX, cursorY, maxWidth, canvasSettings.height);

  if (strokes.length === 0) return;

  store.pushHistory();
  store.setStrokes([...existingStrokes, ...strokes]);
}

export function buildLessonStrokeGroups(
  groups: BoardLine[][],
  canvasSettings: CanvasSettings
): Stroke[][] {
  const startX = HORIZONTAL_PADDING;
  const maxWidth = getBoardTextWidth(canvasSettings.width);
  const result: Stroke[][] = [];
  let cursorY = TOP_PADDING;

  for (const group of groups) {
    const groupStrokes: Stroke[] = [];
    for (const line of group) {
      const written = appendLineStrokes(line, startX, cursorY, maxWidth, canvasSettings.height);
      groupStrokes.push(...written.strokes);
      cursorY = written.cursorY;
    }
    if (groupStrokes.length > 0) {
      result.push(groupStrokes);
      cursorY += GROUP_GAP;
    }
  }

  return result;
}
