import { AI_EXPLANATION_TAG, CanvasSettings, Stroke } from '../types/stroke';
import { renderAllStrokes } from '../engine/stroke/StrokeRenderer';

export function strokesToBase64(
  strokes: Stroke[],
  settings: Pick<CanvasSettings, 'width' | 'height' | 'backgroundColor'>
): string {
  const canvas = document.createElement('canvas');
  canvas.width = settings.width;
  canvas.height = settings.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context');

  renderAllStrokes(ctx, strokes, {
    width: settings.width,
    height: settings.height,
    backgroundColor: settings.backgroundColor,
    gridEnabled: false,
  });

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1] ?? '';
}

export function getHandwritingStrokes(strokes: Stroke[]): Stroke[] {
  return strokes.filter(
    (s) =>
      s.tag !== AI_EXPLANATION_TAG &&
      (s.tool === 'pen' ||
        s.tool === 'highlighter' ||
        s.tool === 'text' ||
        s.tool === 'shape')
  );
}

export function getRecognizableStrokes(strokes: Stroke[]): Stroke[] {
  return getHandwritingStrokes(strokes);
}

/** Text written with the board Text tool — no Gemini needed */
export function extractTextFromStrokes(strokes: Stroke[]): string {
  return strokes
    .filter((s) => s.tool === 'text' && s.textContent)
    .map((s) => s.textContent!)
    .join(' ')
    .trim();
}
