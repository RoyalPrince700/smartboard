import { useBoardStore } from '../stores/boardStore';
import { Stroke } from '../types/stroke';

let timers: number[] = [];
let writeGeneration = 0;

export function cancelBoardLessonWrite(): void {
  for (const timer of timers) window.clearTimeout(timer);
  timers = [];
  writeGeneration += 1;
}

export function writeLessonOnBoard(groups: Stroke[][], delayMs = 480): void {
  cancelBoardLessonWrite();
  const generation = writeGeneration;
  const store = useBoardStore.getState();

  store.pushHistory();
  store.setStrokes([]);
  store.setPointerState({ visible: false, active: false });

  if (groups.length === 0) return;

  let accumulated: Stroke[] = [];

  groups.forEach((group, index) => {
    const timer = window.setTimeout(() => {
      if (generation !== writeGeneration) return;

      accumulated = [...accumulated, ...group];
      const board = useBoardStore.getState();
      board.setStrokes(accumulated);

      const last = group[group.length - 1];
      if (last?.shapeBounds) {
        board.setPointerState({
          x: last.shapeBounds.x1 + 20,
          y: last.shapeBounds.y1 + 10,
          visible: true,
          active: true,
        });
      }

      if (index === groups.length - 1) {
        const hide = window.setTimeout(() => {
          if (generation !== writeGeneration) return;
          useBoardStore.getState().setPointerState({ visible: false, active: false });
        }, 450);
        timers.push(hide);
      }
    }, index === 0 ? 80 : 80 + index * delayMs);

    timers.push(timer);
  });
}
