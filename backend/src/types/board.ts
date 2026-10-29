import { CanvasSettings, Stroke } from './stroke';

export interface AIHistoryEntry {
  id: string;
  inputType: 'text' | 'handwriting' | 'voice';
  rawInput: string;
  classification?: {
    subject: string;
    intent: string;
    difficulty: string;
  };
  responseType: string;
  response: unknown;
  createdAt: Date;
}

export interface LessonMeta {
  subject: string | null;
  educationLevel: string | null;
  tags: string[];
}

export interface BoardDocument {
  _id: string;
  title: string;
  owner: string | null;
  strokes: Stroke[];
  canvasSettings: CanvasSettings;
  aiHistory: AIHistoryEntry[];
  recognizedText: string | null;
  lessonMeta: LessonMeta;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardInput {
  title?: string;
  strokes?: Stroke[];
  canvasSettings?: Partial<CanvasSettings>;
}

export interface UpdateBoardInput {
  title?: string;
  strokes?: Stroke[];
  canvasSettings?: Partial<CanvasSettings>;
  aiHistory?: AIHistoryEntry[];
  recognizedText?: string | null;
  lessonMeta?: Partial<LessonMeta>;
}
