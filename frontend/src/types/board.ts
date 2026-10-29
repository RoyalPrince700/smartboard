import { CanvasSettings, Stroke } from '../types/stroke';

export interface LessonMeta {
  subject: string | null;
  educationLevel: string | null;
  tags: string[];
}

export interface Board {
  _id: string;
  title: string;
  strokes: Stroke[];
  canvasSettings: CanvasSettings;
  aiHistory?: import('./ai').AIHistoryEntry[];
  recognizedText?: string | null;
  lessonMeta?: LessonMeta;
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  _id: string;
  title: string;
  strokeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
