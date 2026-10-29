import { Stroke, STROKE_DATA_VERSION } from '../../types/stroke';

export interface SerializedBoard {
  version: number;
  strokes: Stroke[];
}

export function serializeStrokes(strokes: Stroke[]): string {
  const payload: SerializedBoard = {
    version: STROKE_DATA_VERSION,
    strokes,
  };
  return JSON.stringify(payload);
}

export function deserializeStrokes(json: string): Stroke[] {
  const parsed = JSON.parse(json) as SerializedBoard | Stroke[];
  if (Array.isArray(parsed)) return parsed;
  return parsed.strokes ?? [];
}

export function cloneStrokes(strokes: Stroke[]): Stroke[] {
  return JSON.parse(JSON.stringify(strokes)) as Stroke[];
}
