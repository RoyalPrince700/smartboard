import clsx from 'clsx';
import { Bot, Loader2 } from 'lucide-react';
import { useAIActions } from '../../hooks/useAIActions';
import { useAIStore } from '../../stores/aiStore';

export function BoardSolveButton() {
  const loading = useAIStore((s) => s.loading);
  const setRailCollapsed = useAIStore((s) => s.setRailCollapsed);
  const beginTutorSession = useAIStore((s) => s.beginTutorSession);
  const { askAI } = useAIActions();

  const askTutor = () => {
    setRailCollapsed(false);
    beginTutorSession();
    void askAI();
  };

  return (
    <button
      type="button"
      onClick={askTutor}
      disabled={loading}
      title="Ask Tutor about the board"
      aria-label="Ask Tutor about the board"
      className={clsx(
        'absolute top-3 right-3 z-10 flex items-center gap-2 rounded-xl px-4 py-2.5',
        'min-h-touch bg-indigo-600 text-white font-semibold text-sm shadow-lg',
        'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-colors touch-manipulation',
        'disabled:opacity-60 disabled:cursor-not-allowed'
      )}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin shrink-0" />
      ) : (
        <Bot size={18} className="shrink-0" />
      )}
      {loading ? 'Working…' : 'Tutor'}
    </button>
  );
}
