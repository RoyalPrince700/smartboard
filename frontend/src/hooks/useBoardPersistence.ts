import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { useAIStore } from '../stores/aiStore';
import { createBoard, fetchBoard, updateBoard } from '../services/api/boardApi';
import { AIInteraction } from '../types/ai';
const AUTO_SAVE_DELAY = 3000;

export function useBoardPersistence(boardId: string | undefined) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    strokes,
    title,
    canvasSettings,
    isDirty,
    boardId: storeBoardId,
    setBoardId,
    setSaveStatus,
    markClean,
    loadBoard,
  } = useBoardStore();

  const save = useCallback(async () => {
    const id = storeBoardId ?? boardId;
    if (!id) return;

    setSaveStatus('saving');
    try {
      await updateBoard(id, { title, strokes, canvasSettings });
      setSaveStatus('saved');
      markClean();
    } catch {
      setSaveStatus('error');
    }
  }, [storeBoardId, boardId, title, strokes, canvasSettings, setSaveStatus, markClean]);

  useEffect(() => {
    if (!boardId || boardId === 'new') return;

    let cancelled = false;

    async function load() {
      try {
        const board = await fetchBoard(boardId!);
        if (!cancelled) {
          loadBoard({
            id: board._id,
            title: board.title,
            strokes: board.strokes,
            canvasSettings: board.canvasSettings,
          });

          if (board.recognizedText) {
            useAIStore.getState().setRecognizedText(board.recognizedText);
          }

          if (board.lessonMeta?.educationLevel) {
            useAIStore.getState().setEducationLevel(
              board.lessonMeta.educationLevel as import('../types/ai').EducationLevel
            );
          }

          if (board.aiHistory?.length) {
            const interactions: AIInteraction[] = board.aiHistory
              .slice()
              .reverse()
              .map((entry) => {
                const resp = entry.response as Record<string, unknown>;
                const explanation =
                  (resp?.explanation as AIInteraction['response'] | undefined) ??
                  (entry.response as unknown as AIInteraction['response']);

                return {
                  id: entry.id,
                  inputType: entry.inputType === 'handwriting' ? 'handwriting' as const : 'text' as const,
                  rawInput: entry.rawInput,
                  classification: entry.classification,
                  response: explanation,
                  timestamp: new Date(entry.createdAt).getTime(),
                };
              })
              .filter((i) => i.response?.text);

            if (interactions.length > 0) {
              useAIStore.getState().loadHistory(interactions);
              useAIStore.getState().setCurrentResponse(interactions[0].response);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load board:', err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId, loadBoard]);

  useEffect(() => {
    if (!isDirty || !storeBoardId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [isDirty, storeBoardId, strokes, title, save, canvasSettings]);

  const createAndNavigate = useCallback(async () => {
    const board = await createBoard({ title: 'Untitled Board' });
    setBoardId(board._id);
    loadBoard({
      id: board._id,
      title: board.title,
      strokes: board.strokes,
      canvasSettings: board.canvasSettings,
    });
    return board._id;
  }, [setBoardId, loadBoard]);

  return { save, createAndNavigate };
}
