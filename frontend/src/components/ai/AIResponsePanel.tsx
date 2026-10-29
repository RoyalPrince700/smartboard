import clsx from 'clsx';
import { X } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { TutorAction, TutorActionId } from '../tutor/TutorActionBar';
import { TutorEmpty, TutorError, TutorLoading } from '../tutor/TutorState';
import { DiagramAnalysisPanel } from './DiagramAnalysisPanel';
import { MathSolutionPanel } from './MathSolutionPanel';
import { SubjectResponseView } from './SubjectResponseView';

interface AIResponsePanelProps {
  embedded?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  voiceOutputSupported?: boolean;
  onTutorAction?: (id: TutorActionId) => void;
}

export function AIResponsePanel({
  embedded = false,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  voiceOutputSupported = false,
  onTutorAction,
}: AIResponsePanelProps) {
  const panelOpen = useAIStore((s) => s.panelOpen);
  const loading = useAIStore((s) => s.loading);
  const error = useAIStore((s) => s.error);
  const currentResponse = useAIStore((s) => s.currentResponse);
  const agentResponse = useAIStore((s) => s.agentResponse);
  const currentSolution = useAIStore((s) => s.currentSolution);
  const showGraph = useAIStore((s) => s.showGraph);
  const showDiagram = useAIStore((s) => s.showDiagram);
  const currentDiagram = useAIStore((s) => s.currentDiagram);
  const diagramAnalysis = useAIStore((s) => s.diagramAnalysis);
  const setPanelOpen = useAIStore((s) => s.setPanelOpen);

  if (!embedded && !panelOpen) return null;

  const mathActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    { id: 'simplify', label: 'Simplify' },
    { id: 'try-one', label: 'Try One', disabled: true, hint: 'Interactive practice is coming soon' },
    ...(currentSolution?.graph
      ? [{ id: 'show-graph' as const, label: showGraph ? 'Hide Graph' : 'Show Graph' }]
      : []),
    ...(currentDiagram
      ? [{ id: 'show-diagram' as const, label: showDiagram ? 'Hide Diagram' : 'Show Diagram' }]
      : []),
    { id: 'show-on-board', label: 'Show on Board' },
  ];

  const subjectActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    { id: 'give-example', label: 'Give Example' },
    { id: 'quiz-me', label: 'Quiz Me' },
    ...(currentDiagram
      ? [{ id: 'show-diagram' as const, label: showDiagram ? 'Hide Diagram' : 'Show Diagram' }]
      : []),
    { id: 'show-on-board', label: 'Show on Board' },
  ];
  const diagramActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    ...(currentDiagram
      ? [{ id: 'show-diagram' as const, label: showDiagram ? 'Hide Diagram' : 'Show Diagram' }]
      : []),
  ];

  const content = (
    <div className={clsx('flex-1 space-y-4 overflow-y-auto p-4', embedded && 'h-full')}>
      {loading && <TutorLoading />}

      {error && <TutorError message={error} />}

      {!embedded && voiceOutputSupported && (currentResponse || currentSolution || diagramAnalysis || agentResponse) && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={isSpeaking ? onStopSpeaking : onSpeak}
            className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
          </button>
        </div>
      )}

      {!loading && currentSolution && (
        <MathSolutionPanel
          solution={currentSolution}
          actions={mathActions}
          onAction={onTutorAction}
          loading={loading}
        />
      )}

      {!loading && agentResponse && !currentSolution && !diagramAnalysis && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Enter a quadratic equation (with x^2) to see a full step-by-step solution.
        </div>
      )}

      {!loading && diagramAnalysis && (
        <DiagramAnalysisPanel
          analysis={diagramAnalysis}
          actions={diagramActions}
          onAction={onTutorAction}
          loading={loading}
        />
      )}

      {!loading && currentResponse && !currentSolution && !diagramAnalysis && !agentResponse && (
        <SubjectResponseView
          response={currentResponse}
          actions={subjectActions}
          onAction={onTutorAction}
          loading={loading}
        />
      )}

      {!loading && !error && !currentResponse && !currentSolution && !diagramAnalysis && !agentResponse && (
        <TutorEmpty />
      )}
    </div>
  );

  if (embedded) {
    return <div className="h-full flex flex-col">{content}</div>;
  }

  return (
    <aside
      className={clsx(
        'absolute top-0 right-0 bottom-0 z-30 w-[min(420px,90vw)]',
        'border-l border-slate-200 bg-slate-50',
        'flex flex-col shadow-2xl pointer-events-auto'
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-lg font-bold text-slate-900">Tutor</h2>
        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Close Tutor panel"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      {content}
    </aside>
  );
}
