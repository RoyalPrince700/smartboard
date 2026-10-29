import { estimateRichTextWidth, measureRichTextHeight } from '../engine/stroke/RichTextRenderer';
import { createPoint, startStroke } from '../engine/stroke/StrokeEngine';
import { useBoardStore } from '../stores/boardStore';
import { AI_EXPLANATION_TAG, CanvasSettings, VOICE_EQUATION_TAG } from '../types/stroke';
import { cancelBoardLessonWrite } from './boardLessonWriter';
import { parseFractionSegments } from './mathFraction';
import { sanitizeEquationInput } from './voiceMathParser';

const EQUATION_STROKE_WIDTH = 4.2;
const EQUATION_COLOR = '#0f3460';

interface VoiceEquationSession {
  tokens: string[];
  strokeId: string | null;
  committed: boolean;
}

let session: VoiceEquationSession = {
  tokens: [],
  strokeId: null,
  committed: false,
};

export function getVoiceEquationText(): string {
  return session.tokens.join('');
}

export function hasVoiceEquation(): boolean {
  return session.tokens.length > 0;
}

export function getVoiceEquationTokens(): string[] {
  return [...session.tokens];
}

function removeVoiceStroke(strokes: ReturnType<typeof useBoardStore.getState>['strokes']) {
  return strokes.filter((stroke) => stroke.tag !== VOICE_EQUATION_TAG && stroke.id !== session.strokeId);
}

function buildCenteredStroke(equation: string, canvasSettings: CanvasSettings) {
  const fontSize = EQUATION_STROKE_WIDTH * 8;
  const width = Math.max(canvasSettings.width, 800);
  const height = Math.max(canvasSettings.height, 600);
  const textWidth = estimateRichTextWidth(equation, fontSize);
  const boundsHeight = measureRichTextHeight(fontSize);
  const startX = Math.max(24, (width - textWidth) / 2);
  const startY = Math.max(24, height * 0.42 - fontSize / 2);
  const baselineY = startY + fontSize;

  return startStroke({
    tool: 'text',
    color: EQUATION_COLOR,
    width: EQUATION_STROKE_WIDTH,
    point: createPoint(startX, baselineY),
    textContent: equation,
    textSegments: parseFractionSegments(equation),
    shapeBounds: {
      x1: startX,
      y1: startY,
      x2: startX + textWidth,
      y2: baselineY + boundsHeight * 0.15,
    },
    tag: VOICE_EQUATION_TAG,
  });
}

/** Draft only — does not touch the canvas (keeps mic stable while speaking slowly). */
export function setVoiceDraftTokens(tokens: string[]): string {
  session.tokens = tokens.filter(Boolean);
  session.committed = false;
  return getVoiceEquationText();
}

export function appendVoiceDraftTokens(tokens: string[]): string {
  if (tokens.length === 0) return getVoiceEquationText();

  const incoming = tokens.join('');
  const current = getVoiceEquationText();
  if (current.endsWith('=') && incoming.trim() === '=') {
    return current;
  }

  session.tokens = [...session.tokens, ...tokens];
  session.committed = false;
  const merged = sanitizeEquationInput(getVoiceEquationText());
  session.tokens = merged ? [merged] : [];
  return merged;
}

export function replaceVoiceDraft(equation: string): string {
  const cleaned = sanitizeEquationInput(equation);
  session.tokens = cleaned ? [cleaned] : [];
  session.committed = false;
  return getVoiceEquationText();
}

export function undoVoiceDraft(): string {
  if (session.tokens.length === 0) return '';
  session.tokens = session.tokens.slice(0, -1);
  session.committed = false;
  return getVoiceEquationText();
}

export function clearVoiceDraft(): void {
  session.tokens = [];
  session.strokeId = null;
  session.committed = false;
}

/** Write the drafted equation onto the board once (call on solve). */
export function commitVoiceEquationToBoard(canvasSettings: CanvasSettings): string {
  const store = useBoardStore.getState();
  const equation = getVoiceEquationText();
  const withoutVoice = removeVoiceStroke(store.strokes);

  if (!equation) {
    store.pushHistory();
    store.setStrokes(withoutVoice);
    session.strokeId = null;
    session.committed = false;
    return '';
  }

  const stroke = buildCenteredStroke(equation, canvasSettings);
  session.strokeId = stroke.id;
  session.committed = true;
  store.pushHistory();
  store.setStrokes([...withoutVoice, stroke]);
  return equation;
}

/** @deprecated Prefer draft helpers + commitVoiceEquationToBoard */
export function appendVoiceEquationTokens(tokens: string[], _canvasSettings: CanvasSettings): string {
  return appendVoiceDraftTokens(tokens);
}

/** @deprecated Prefer replaceVoiceDraft + commitVoiceEquationToBoard */
export function replaceVoiceEquation(equation: string, canvasSettings: CanvasSettings): string {
  replaceVoiceDraft(equation);
  return commitVoiceEquationToBoard(canvasSettings);
}

export function undoLastVoiceToken(_canvasSettings: CanvasSettings): string {
  return undoVoiceDraft();
}

export function clearVoiceEquation(_canvasSettings?: CanvasSettings): void {
  const store = useBoardStore.getState();
  if (session.committed || session.strokeId) {
    const withoutVoice = removeVoiceStroke(store.strokes);
    store.pushHistory();
    store.setStrokes(withoutVoice);
  }
  clearVoiceDraft();
}

/** Stop animated board dumps and remove dumped lesson text strokes. */
export function clearDumpedLessonFromBoard(): void {
  cancelBoardLessonWrite();
  const store = useBoardStore.getState();
  const remaining = store.strokes.filter(
    (stroke) => stroke.tag !== AI_EXPLANATION_TAG && stroke.tag !== VOICE_EQUATION_TAG
  );
  clearVoiceDraft();
  store.pushHistory();
  store.setStrokes(remaining);
  store.setPointerState({ visible: false, active: false });
}

/** Clear the dictation buffer after a successful solve without wiping the board. */
export function resetVoiceEquationSession(): void {
  session.tokens = [];
  session.strokeId = null;
  session.committed = false;
}
