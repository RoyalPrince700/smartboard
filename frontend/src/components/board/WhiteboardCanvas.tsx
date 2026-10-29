import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { PointerIndicator } from './PointerIndicator';
import { DiagramOverlay } from '../math/DiagramOverlay';
import { GraphOverlay } from '../math/GraphOverlay';
import { usePointerDrawing } from '../../hooks/usePointerDrawing';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useLandscapeBoard } from '../../hooks/useLandscapeBoard';
import { useBoardStore } from '../../stores/boardStore';
import { useAIStore } from '../../stores/aiStore';
import type { TutorActionId } from '../tutor/TutorActionBar';
import { BoardLessonOverlay } from './BoardLessonOverlay';
import { BoardTutorBar } from './BoardTutorBar';

interface WhiteboardCanvasProps {
  onTutorAction: (id: TutorActionId) => void;
  onAsk: () => void;
  onVoiceAsk: (text: string) => void;
  onCancelVoice?: () => void;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  voiceOutputSupported?: boolean;
}

export function WhiteboardCanvas({
  onTutorAction,
  onAsk,
  onVoiceAsk,
  onCancelVoice,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  voiceOutputSupported,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseDrawingEnabled = useBoardStore((s) => s.mouseDrawingEnabled);
  const focusMode = useAIStore((s) => s.focusMode);
  const boardLessonOpen = useAIStore((s) => s.boardLessonOpen);
  const toggleFocusMode = useAIStore((s) => s.toggleFocusMode);
  const { isCompactLandscape } = useLandscapeBoard();

  usePointerDrawing(canvasRef, containerRef);
  useKeyboardShortcuts();

  useEffect(() => {
    if (isCompactLandscape) {
      useAIStore.getState().setBoardTopCollapsed(true);
    }
  }, [isCompactLandscape]);

  useEffect(() => {
    if (!focusMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode, toggleFocusMode]);

  return (
    <div className={clsx(
      'absolute inset-0 flex items-stretch justify-stretch pointer-events-none',
      focusMode
        ? boardLessonOpen
          ? 'p-0'
          : 'p-0 pb-24 max-md:pb-0'
        : 'p-2 pb-20 landscape-board:p-0'
    )}>
      <div
        ref={containerRef}
        className={clsx(
          'relative pointer-events-auto w-full h-full touch-none',
          focusMode
            ? 'bg-white'
            : 'bg-white rounded-2xl border border-neutral-200 shadow-sm landscape-board:rounded-none landscape-board:border-0 landscape-board:shadow-none'
        )}
      >
        <canvas
          ref={canvasRef}
          className={clsx(
            'block w-full h-full touch-none',
            focusMode ? '' : 'rounded-xl landscape-board:rounded-none',
            mouseDrawingEnabled ? 'cursor-none' : 'cursor-default'
          )}
          style={{ touchAction: 'none' }}
        />
        <BoardTutorBar
          onAsk={onAsk}
          onVoiceAsk={onVoiceAsk}
          onCancelVoice={onCancelVoice}
          onSpeak={onSpeak}
          onStopSpeaking={onStopSpeaking}
          isSpeaking={isSpeaking}
          voiceOutputSupported={voiceOutputSupported}
        />
        <PointerIndicator />
        <GraphOverlay />
        <DiagramOverlay />
        <BoardLessonOverlay onTutorAction={onTutorAction} />
      </div>
    </div>
  );
}
