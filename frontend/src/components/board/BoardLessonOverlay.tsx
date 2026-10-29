import { useEffect, useRef } from 'react';
import { ArrowLeft, Bot, ChevronUp, PenLine, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAIStore } from '../../stores/aiStore';
import { TutorAction, TutorActionId } from '../tutor/TutorActionBar';
import { TutorError, TutorLoading } from '../tutor/TutorState';
import { DiagramAnalysisPanel } from '../ai/DiagramAnalysisPanel';
import { MathSolutionPanel } from '../ai/MathSolutionPanel';
import { SubjectResponseView } from '../ai/SubjectResponseView';
import { StepReferenceNavigator } from '../tutor/StepReferenceNavigator';
import { formatSolvedArithmeticDisplay } from '../../utils/voiceMathParser';

interface BoardLessonOverlayProps {
  onTutorAction: (id: TutorActionId) => void;
}

export function BoardLessonOverlay({ onTutorAction }: BoardLessonOverlayProps) {
  const open = useAIStore((state) => state.boardLessonOpen);
  const boardTopCollapsed = useAIStore((state) => state.boardTopCollapsed);
  const focusMode = useAIStore((state) => state.focusMode);
  const toggleBoardTopCollapsed = useAIStore((state) => state.toggleBoardTopCollapsed);
  const lessonKey = useAIStore((state) => state.boardLessonKey);
  const loading = useAIStore((state) => state.loading);
  const error = useAIStore((state) => state.error);
  const solution = useAIStore((state) => state.currentSolution);
  const response = useAIStore((state) => state.currentResponse);
  const agentResponse = useAIStore((state) => state.agentResponse);
  const agentProblemEquation = useAIStore((state) => state.agentProblemEquation);
  const diagramAnalysis = useAIStore((state) => state.diagramAnalysis);
  const currentDiagram = useAIStore((state) => state.currentDiagram);
  const showDiagram = useAIStore((state) => state.showDiagram);
  const showGraph = useAIStore((state) => state.showGraph);
  const history = useAIStore((state) => state.history);
  const inputText = useAIStore((state) => state.inputText);
  const narrationFocus = useAIStore((state) => state.narrationFocus);
  const setBoardLessonOpen = useAIStore((state) => state.setBoardLessonOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasContent = Boolean(solution || response || agentResponse || diagramAnalysis);
  const showThinking = loading || (!hasContent && !error);

  useEffect(() => {
    if (narrationFocus?.kind === 'question') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [narrationFocus]);

  const questionFallback =
    agentProblemEquation ||
    history[0]?.rawInput ||
    inputText.trim() ||
    'Let’s explore this together';
  const question =
    solution?.problemType === 'arithmetic' && solution.answer
      ? formatSolvedArithmeticDisplay(
          solution.recognizedInput || solution.equation || questionFallback,
          solution.answer
        )
      : solution?.recognizedInput ||
        solution?.equation ||
        questionFallback;

  const agentFollowUpActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    { id: 'simplify', label: 'Simplify' },
    { id: 'give-example', label: 'Give Example' },
  ];

  const defaultMathActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    { id: 'simplify', label: 'Simplify' },
  ];

  const mathActions: TutorAction[] = [
    ...(agentResponse ? agentFollowUpActions : defaultMathActions),
    { id: 'try-one', label: 'Try One', disabled: true, hint: 'Interactive practice is coming soon' },
    ...(solution?.graph
      ? [{ id: 'show-graph' as const, label: showGraph ? 'Hide Graph' : 'Show Graph' }]
      : []),
    ...(currentDiagram
      ? [{ id: 'show-diagram' as const, label: showDiagram ? 'Hide Diagram' : 'Show Diagram' }]
      : []),
  ];

  const subjectActions: TutorAction[] = [
    { id: 'explain-more', label: 'Explain More' },
    { id: 'give-example', label: 'Give Example' },
    { id: 'quiz-me', label: 'Quiz Me' },
    ...(currentDiagram
      ? [{ id: 'show-diagram' as const, label: showDiagram ? 'Hide Diagram' : 'Show Diagram' }]
      : []),
  ];

  const handleAction = (action: TutorActionId) => {
    onTutorAction(action);
    if (action === 'show-graph' || action === 'show-diagram') {
      setBoardLessonOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key={lessonKey}
          initial={{ opacity: 0, y: focusMode ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: focusMode ? 0 : 12 }}
          transition={{ duration: focusMode ? 0.18 : 0.28, ease: 'easeOut' }}
          className={`absolute inset-0 z-40 flex flex-col overflow-hidden ${
            focusMode
              ? 'bg-white pt-[max(3rem,env(safe-area-inset-top))]'
              : `rounded-xl bg-[#f8fafc] landscape-board:rounded-none ${
                  boardTopCollapsed ? 'pt-12 landscape-board:pt-10' : 'pt-[76px] landscape-board:pt-[52px]'
                }`
          }`}
          aria-label="Tutor lesson on whiteboard"
        >
          {!focusMode && !boardTopCollapsed && (
          <header
            data-step-nav="question"
            className={`sticky top-0 z-10 shrink-0 border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur transition sm:px-6 ${
            narrationFocus?.kind === 'question'
              ? 'border-indigo-400 ring-4 ring-inset ring-indigo-100'
              : 'border-slate-200'
          }`}>
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Bot size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                  <PenLine size={14} aria-hidden="true" />
                  Question
                </div>
                <h1 className="break-words text-base font-bold leading-snug text-slate-900 sm:text-lg">
                  {question}
                </h1>
              </div>
              <button
                type="button"
                onClick={toggleBoardTopCollapsed}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Hide question bar"
                title="Hide controls"
              >
                <ChevronUp size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setBoardLessonOpen(false)}
                className="hidden min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:flex"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Back to writing
              </button>
              <button
                type="button"
                onClick={() => setBoardLessonOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:hidden"
                aria-label="Back to writing"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>
          )}

          {focusMode && (
            <p
              data-step-nav="question"
              className="shrink-0 px-6 pb-2 text-center text-sm font-medium text-slate-400 sm:text-base"
            >
              {question}
            </p>
          )}

          <div className="flex min-h-0 flex-1">
            <div
              ref={scrollRef}
              className={`board-lesson-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ${
                focusMode ? 'px-6 py-4 sm:px-10 sm:py-6' : 'px-4 py-5 sm:px-6 sm:py-7'
              }`}
              style={{ touchAction: 'pan-y' }}
            >
              <div className={`mx-auto pb-16 ${focusMode ? 'max-w-5xl' : 'max-w-4xl'}`}>
                {showThinking && <TutorLoading />}
                {error && <TutorError message={error} />}

                {!showThinking && solution && (
                  <MathSolutionPanel
                    solution={solution}
                    actions={mathActions}
                    onAction={handleAction}
                    loading={loading}
                    showProblem={false}
                    displayMode="board"
                  />
                )}

                {!showThinking && agentResponse && !solution && !diagramAnalysis && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                    The tutor understood your request but could not build a step-by-step solution yet.
                    Try entering a quadratic such as <strong>2x^2 + 5x - 3 = 0</strong>, or write an equation on the board.
                  </div>
                )}

                {!showThinking && diagramAnalysis && !solution && (
                  <DiagramAnalysisPanel
                    analysis={diagramAnalysis}
                    actions={subjectActions}
                    onAction={handleAction}
                    loading={loading}
                  />
                )}

                {!showThinking && response && !solution && !diagramAnalysis && !agentResponse && (
                  <SubjectResponseView
                    response={response}
                    actions={subjectActions}
                    onAction={handleAction}
                    loading={loading}
                    displayMode="board"
                  />
                )}
              </div>
            </div>

            {!showThinking && solution && solution.steps.length > 0 && (
              <StepReferenceNavigator
                steps={solution.steps}
                answer={solution.answer}
                scrollRef={scrollRef}
                lessonKey={lessonKey}
              />
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
