import { Schema, model, Document, Types } from 'mongoose';
import { CanvasSettings, Stroke } from '../types/stroke';
import { AIHistoryEntry, LessonMeta } from '../types/board';
import { DEFAULT_CANVAS_SETTINGS } from '../types/stroke';

const PointSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    pressure: { type: Number, default: 0.5 },
    timestamp: { type: Number, required: true },
  },
  { _id: false }
);

const ShapeBoundsSchema = new Schema(
  {
    x1: Number,
    y1: Number,
    x2: Number,
    y2: Number,
  },
  { _id: false }
);

const StrokeSchema = new Schema(
  {
    id: { type: String, required: true },
    tool: {
      type: String,
      enum: ['pen', 'highlighter', 'eraser', 'shape', 'text'],
      required: true,
    },
    points: [PointSchema],
    width: { type: Number, required: true },
    color: { type: String, required: true },
    opacity: { type: Number },
    shapeType: {
      type: String,
      enum: ['line', 'rectangle', 'circle', 'triangle', null],
    },
    shapeBounds: ShapeBoundsSchema,
    textContent: String,
    finished: { type: Boolean, default: false },
  },
  { _id: false }
);

const CanvasSettingsSchema = new Schema(
  {
    width: { type: Number, default: DEFAULT_CANVAS_SETTINGS.width },
    height: { type: Number, default: DEFAULT_CANVAS_SETTINGS.height },
    backgroundColor: {
      type: String,
      default: DEFAULT_CANVAS_SETTINGS.backgroundColor,
    },
    gridEnabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const AIHistorySchema = new Schema(
  {
    id: String,
    inputType: { type: String, enum: ['text', 'handwriting', 'voice'] },
    rawInput: String,
    classification: {
      subject: String,
      intent: String,
      difficulty: String,
    },
    responseType: String,
    response: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LessonMetaSchema = new Schema(
  {
    subject: { type: String, default: null },
    educationLevel: { type: String, default: null },
    tags: { type: [String], default: [] },
  },
  { _id: false }
);

export interface IBoard extends Document {
  title: string;
  owner: Types.ObjectId | null;
  strokes: Stroke[];
  canvasSettings: CanvasSettings;
  aiHistory: AIHistoryEntry[];
  recognizedText: string | null;
  lessonMeta: LessonMeta;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    title: { type: String, default: 'Untitled Board' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    strokes: { type: [StrokeSchema], default: [] },
    canvasSettings: {
      type: CanvasSettingsSchema,
      default: () => ({ ...DEFAULT_CANVAS_SETTINGS }),
    },
    aiHistory: { type: [AIHistorySchema], default: [] },
    recognizedText: { type: String, default: null },
    lessonMeta: {
      type: LessonMetaSchema,
      default: () => ({ subject: null, educationLevel: null, tags: [] }),
    },
  },
  { timestamps: true }
);

BoardSchema.index({ owner: 1, updatedAt: -1 });
BoardSchema.index({ updatedAt: -1 });

export const Board = model<IBoard>('Board', BoardSchema);
