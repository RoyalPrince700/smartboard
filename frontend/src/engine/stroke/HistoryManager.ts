import { Stroke } from '../../types/stroke';

const MAX_HISTORY = 50;

export class HistoryManager {
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];

  pushSnapshot(strokes: Stroke[]): void {
    this.undoStack.push(JSON.parse(JSON.stringify(strokes)));
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(current: Stroke[]): Stroke[] | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.parse(JSON.stringify(current)));
    return this.undoStack.pop() ?? null;
  }

  redo(current: Stroke[]): Stroke[] | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.parse(JSON.stringify(current)));
    return this.redoStack.pop() ?? null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const historyManager = new HistoryManager();
