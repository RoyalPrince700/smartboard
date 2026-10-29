import clsx from 'clsx';
import { FormEvent } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { EDUCATION_LEVELS } from '../../types/ai';
import { SubjectSelector } from './SubjectSelector';
import { Button } from '../common/Button';
import { VoiceMicButton } from './VoiceMicButton';
interface AIInputBarProps {
  onAsk: () => void;
  onInterpretBoard: () => void;
  onRecognize: () => void;
  onSolve: () => void;
  onAnalyzeDiagram: () => void;
  onVisualize: () => void;
  onVoiceAsk: (text: string) => void;
}

export function AIInputBar({
  onAsk,
  onInterpretBoard,
  onRecognize,
  onSolve,
  onAnalyzeDiagram,
  onVisualize,
  onVoiceAsk,
}: AIInputBarProps) {
  const inputText = useAIStore((s) => s.inputText);
  const setInputText = useAIStore((s) => s.setInputText);
  const educationLevel = useAIStore((s) => s.educationLevel);
  const setEducationLevel = useAIStore((s) => s.setEducationLevel);
  const loading = useAIStore((s) => s.loading);
  const panelOpen = useAIStore((s) => s.panelOpen);
  const togglePanel = useAIStore((s) => s.togglePanel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAsk();
  };

  return (
    <div
      className={clsx(
        'absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[min(720px,calc(100%-2rem))] pointer-events-auto',
        panelOpen && 'top-3'
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-board-surface/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-3 flex flex-col gap-2"
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask or enter an equation… e.g. 2x² + 5x - 3 = 0"
            disabled={loading}
            className="flex-1 bg-board-bg/60 text-white placeholder-white/40 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-board-accent min-h-touch"
          />
          <Button type="submit" variant="accent" disabled={loading || !inputText.trim()}>
            {loading ? '…' : 'ASK'}
          </Button>
          <VoiceMicButton onVoiceAsk={onVoiceAsk} disabled={loading} />
        </div>

        <SubjectSelector />

        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            {EDUCATION_LEVELS.map((level) => (              <button
                key={level.id}
                type="button"
                disabled={loading}
                onClick={() => setEducationLevel(level.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm touch-manipulation transition-colors',
                  educationLevel === level.id
                    ? 'bg-board-accent text-white'
                    : 'bg-board-toolbar text-white/70 hover:text-white'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onSolve}
              disabled={loading}
              variant="accent"
              title="Solve equation step-by-step"
            >
              SOLVE
            </Button>
            <Button
              type="button"
              onClick={onRecognize}
              disabled={loading}
              title="Recognize handwriting on board"
            >
              READ BOARD
            </Button>
            <Button
              type="button"
              onClick={onVisualize}
              disabled={loading}
              title="Generate diagram or graph from topic or board"
            >
              VISUALIZE
            </Button>
            <Button
              type="button"
              onClick={onAnalyzeDiagram}
              disabled={loading}
              title="Analyze shapes and geometry on board"
            >
              ANALYZE
            </Button>
            <Button
              type="button"
              onClick={onInterpretBoard}
              disabled={loading}
              title="Recognize board content and explain"
            >
              EXPLAIN BOARD
            </Button>
            <Button type="button" onClick={togglePanel} variant="accent">
              {panelOpen ? 'HIDE AI' : 'SHOW AI'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
