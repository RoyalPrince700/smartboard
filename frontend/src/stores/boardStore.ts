import { create } from 'zustand';
import { historyManager } from '../engine/stroke/HistoryManager';
import { cloneStrokes } from '../engine/stroke/StrokeSerializer';
import { DEFAULT_CANVAS_SETTINGS, Stroke, AI_EXPLANATION_TAG } from '../types/stroke';
import { DEFAULT_TOOL_SETTINGS, ToolSettings } from '../types/tools';
import { SaveStatus } from '../types/board';

export interface PointerState {
  x: number;
  y: number;
  visible: boolean;
  active: boolean;
}

interface BoardState {
  boardId: string | null;
  title: string;
  strokes: Stroke[];
  activeStrokeId: string | null;
  canvasSettings: typeof DEFAULT_CANVAS_SETTINGS;
  toolSettings: ToolSettings;
  saveStatus: SaveStatus;
  isDirty: boolean;
  pointerState: PointerState;
  mouseDrawingEnabled: boolean;

  setBoardId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setStrokes: (strokes: Stroke[]) => void;
  addStroke: (stroke: Stroke) => void;
  updateStroke: (id: string, updater: (stroke: Stroke) => Stroke) => void;
  removeStrokesByIds: (ids: string[]) => void;
  replaceExplanationStrokes: (strokes: Stroke[]) => void;
  setActiveStrokeId: (id: string | null) => void;
  setToolSettings: (partial: Partial<ToolSettings>) => void;
  setCanvasSettings: (partial: Partial<typeof DEFAULT_CANVAS_SETTINGS>) => void;
  setPointerState: (partial: Partial<PointerState>) => void;
  setMouseDrawingEnabled: (enabled: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markDirty: () => void;
  markClean: () => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearBoard: () => void;
  loadBoard: (data: { id: string; title: string; strokes: Stroke[]; canvasSettings?: typeof DEFAULT_CANVAS_SETTINGS }) => void;

  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  title: 'Untitled Board',
  strokes: [],
  activeStrokeId: null,
  canvasSettings: { ...DEFAULT_CANVAS_SETTINGS },
  toolSettings: { ...DEFAULT_TOOL_SETTINGS },
  saveStatus: 'idle',
  isDirty: false,
  pointerState: { x: 0, y: 0, visible: false, active: false },
  mouseDrawingEnabled: false,

  setBoardId: (id) => set({ boardId: id }),
  setTitle: (title) => set({ title, isDirty: true }),
  setStrokes: (strokes) => set({ strokes }),
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke], isDirty: true })),
  updateStroke: (id, updater) =>
    set((state) => ({
      strokes: state.strokes.map((s) => (s.id === id ? updater(s) : s)),
      isDirty: true,
    })),
  removeStrokesByIds: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      strokes: state.strokes.filter((s) => !idSet.has(s.id)),
      isDirty: true,
    }));
  },
  replaceExplanationStrokes: (newStrokes) =>
    set((state) => ({
      strokes: [
        ...state.strokes.filter((s) => s.tag !== AI_EXPLANATION_TAG),
        ...newStrokes,
      ],
      isDirty: true,
    })),
  setActiveStrokeId: (id) => set({ activeStrokeId: id }),
  setToolSettings: (partial) =>
    set((state) => ({
      toolSettings: { ...state.toolSettings, ...partial },
    })),
  setCanvasSettings: (partial) =>
    set((state) => {
      const next = { ...state.canvasSettings, ...partial };
      if (
        next.width === state.canvasSettings.width &&
        next.height === state.canvasSettings.height &&
        next.backgroundColor === state.canvasSettings.backgroundColor &&
        next.gridEnabled === state.canvasSettings.gridEnabled
      ) {
        return state;
      }
      return { canvasSettings: next };
    }),
  setPointerState: (partial) =>
    set((state) => ({ pointerState: { ...state.pointerState, ...partial } })),
  setMouseDrawingEnabled: (enabled) => set({ mouseDrawingEnabled: enabled }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  pushHistory: () => {
    historyManager.pushSnapshot(get().strokes);
  },

  undo: () => {
    const prev = historyManager.undo(get().strokes);
    if (prev) set({ strokes: prev, isDirty: true });
  },

  redo: () => {
    const next = historyManager.redo(get().strokes);
    if (next) set({ strokes: next, isDirty: true });
  },

  clearBoard: () => {
    get().pushHistory();
    set({ strokes: [], activeStrokeId: null, isDirty: true });
  },

  loadBoard: (data) => {
    historyManager.clear();
    set({
      boardId: data.id,
      title: data.title,
      strokes: cloneStrokes(data.strokes),
      canvasSettings: data.canvasSettings ?? { ...DEFAULT_CANVAS_SETTINGS },
      activeStrokeId: null,
      isDirty: false,
      saveStatus: 'idle',
    });
  },

  canUndo: () => historyManager.canUndo(),
  canRedo: () => historyManager.canRedo(),
}));
