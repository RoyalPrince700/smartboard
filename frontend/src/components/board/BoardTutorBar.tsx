import { FormEvent } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  Focus,
  Mic,
  Minimize2,
  Send,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useAIStore } from '../../stores/aiStore';
import { replaceVoiceDraft } from '../../utils/voiceEquationBoard';
import { sanitizeEquationInput } from '../../utils/voiceMathParser';
import { useCompactChrome } from '../../hooks/useLandscapeBoard';
import { LearningLevelSelector } from '../tutor/LearningLevelSelector';
import { SpeechSpeedSelector } from '../tutor/SpeechSpeedSelector';
import { SpeechVoiceSelector } from '../tutor/SpeechVoiceSelector';
import { formatLessonQuestion } from '../../utils/lessonQuestion';
import { VoiceMathDebugPanel } from './VoiceMathDebugPanel';

interface BoardTutorBarProps {
  onAsk: () => void;
  onVoiceAsk: (text: string) => void;
  onCancelVoice?: () => void;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  voiceOutputSupported?: boolean;
}

export function BoardTutorBar({
  onAsk,
  onVoiceAsk,
  onCancelVoice,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  voiceOutputSupported = false,
}: BoardTutorBarProps) {
  const inputText = useAIStore((state) => state.inputText);
  const setInputText = useAIStore((state) => state.setInputText);
  const loading = useAIStore((state) => state.loading);
  const autoSpeak = useAIStore((state) => state.autoSpeak);
  const toggleAutoSpeak = useAIStore((state) => state.toggleAutoSpeak);
  const beginTutorSession = useAIStore((state) => state.beginTutorSession);
  const boardLessonOpen = useAIStore((state) => state.boardLessonOpen);
  const boardTopCollapsed = useAIStore((state) => state.boardTopCollapsed);
  const toggleBoardTopCollapsed = useAIStore((state) => state.toggleBoardTopCollapsed);
  const focusMode = useAIStore((state) => state.focusMode);
  const toggleFocusMode = useAIStore((state) => state.toggleFocusMode);
  const currentSolution = useAIStore((state) => state.currentSolution);
  const currentResponse = useAIStore((state) => state.currentResponse);
  const diagramAnalysis = useAIStore((state) => state.diagramAnalysis);
  const setShowGraph = useAIStore((state) => state.setShowGraph);
  const setShowDiagram = useAIStore((state) => state.setShowDiagram);
  const agentResponse = useAIStore((state) => state.agentResponse);
  const agentProblemEquation = useAIStore((state) => state.agentProblemEquation);
  const history = useAIStore((state) => state.history);
  const narrationFocus = useAIStore((state) => state.narrationFocus);
  const setBoardLessonOpen = useAIStore((state) => state.setBoardLessonOpen);
  const setCurrentResponse = useAIStore((state) => state.setCurrentResponse);
  const setLoading = useAIStore((state) => state.setLoading);
  const error = useAIStore((state) => state.error);
  const setVoiceDraftText = useAIStore((state) => state.setVoiceDraftText);
  const hasAnswer = Boolean(currentSolution || currentResponse || diagramAnalysis || agentResponse);
  const compact = useCompactChrome();
  const lessonQuestion = formatLessonQuestion({
    solution: currentSolution,
    agentProblemEquation,
    historyRawInput: history[0]?.rawInput,
    inputText,
  });

  const {
    supported: voiceSupported,
    isListening,
    hearingText,
    parsedEquation,
    toggleListening,
    stopListening,
    clearHearing,
    undoLast,
    debugEvents,
    debugEnabled,
  } = useVoiceInput({
    mode: 'math',
    continuous: true,
    onBufferChange: (equation) => {
      const cleaned = sanitizeEquationInput(equation);
      setVoiceDraftText(cleaned);
      setInputText(cleaned);
      replaceVoiceDraft(cleaned);
    },
    onConfirmedIntent: (intent) => {
      if (intent.type === 'SOLVE_COMMAND') {
        const equation = intent.equation.trim();
        stopListening();
        setVoiceDraftText(equation);
        replaceVoiceDraft(equation);
        clearHearing();
        onVoiceAsk(equation ? `${equation} solve` : 'solve');
        return;
      }

      if (intent.type === 'CLEAR_COMMAND') {
        stopListening();
        clearHearing();
        setVoiceDraftText('');
        onCancelVoice?.();
        return;
      }

      if (intent.type === 'UNDO_COMMAND') {
        undoLast();
        return;
      }

      if (intent.type === 'EXPLAIN_COMMAND') {
        onVoiceAsk('explain this');
        return;
      }

      if (intent.type === 'READ_ALOUD_COMMAND') {
        onSpeak?.();
        return;
      }

      if (intent.type === 'STOP_COMMAND') {
        onStopSpeaking?.();
      }
    },
  });

  // Persistent equation from the math buffer — never rebuilt from the latest Chrome transcript.
  const hearingDisplay = hearingText.trim();
  const canCancelVoice = Boolean(onCancelVoice && (isListening || hearingDisplay));

  const startOrStopVoice = () => {
    if (isListening) {
      stopListening();
      return;
    }
    setBoardLessonOpen(false);
    setCurrentResponse(null);
    setLoading(false);
    setVoiceDraftText('');
    clearHearing();
    toggleListening();
  };

  const handleCancelVoice = () => {
    stopListening();
    clearHearing();
    setVoiceDraftText('');
    onCancelVoice?.();
  };

  const askTutor = () => {
    beginTutorSession();
    onAsk();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    askTutor();
  };

  const showAnswer = () => {
    setShowGraph(false);
    setShowDiagram(false);
    setBoardLessonOpen(true);
  };

  const floatingButtonClass =
    'flex min-h-[36px] items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/90 px-3 text-sm font-semibold text-neutral-600 shadow-md backdrop-blur transition hover:bg-white hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400';

  const barShellClass =
    'absolute inset-x-0 top-0 z-50 px-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] landscape-board:pl-[max(3.5rem,calc(env(safe-area-inset-left)+3rem))]';

  const iconButtonClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50';

  const tutorButtonClass =
    'flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-60';

  const hearingStatus =
    !boardTopCollapsed && (isListening || error) ? (
      <div
        className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
          error ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-100 text-neutral-700'
        }`}
        role="status"
      >
        <span className="min-w-0 truncate">
          {error
            ? error
            : hearingDisplay
              ? `Hearing: ${hearingDisplay}`
              : 'Listening… speak at your pace, then say "solve".'}
        </span>
        {canCancelVoice && (
          <button
            type="button"
            onClick={handleCancelVoice}
            className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-neutral-700 hover:bg-white"
          >
            Cancel
          </button>
        )}
      </div>
    ) : null;

  const tutorButton = (
    <button
      type="button"
      onClick={askTutor}
      disabled={loading}
      className={tutorButtonClass}
      aria-label={loading ? 'Tutor is working' : 'Ask Tutor'}
    >
      <Bot size={18} aria-hidden="true" />
      <span>{loading ? 'Working...' : 'Tutor'}</span>
    </button>
  );

  const backToWritingButton = (
    <button
      type="button"
      onClick={() => setBoardLessonOpen(false)}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
      aria-label="Back to writing"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className="hidden min-[680px]:inline">Back</span>
    </button>
  );

  if (compact) {
    return (
      <div className={barShellClass}>
        <div className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
          {boardLessonOpen && backToWritingButton}

          {boardLessonOpen ? (
            <p
              className={clsx(
                'min-w-0 flex-1 truncate px-1 text-sm font-semibold text-neutral-900',
                narrationFocus?.kind === 'question' && 'rounded-lg ring-2 ring-indigo-400'
              )}
              title={lessonQuestion}
            >
              {lessonQuestion}
            </p>
          ) : boardTopCollapsed ? (
            <span className="min-w-0 flex-1" />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-neutral-100 p-1"
            >
              <input
                type="text"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Ask a question or use your writing..."
                disabled={loading}
                className="min-h-[36px] min-w-0 flex-1 bg-transparent px-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                aria-label="Question for Tutor"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-40"
                aria-label="Send question"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          )}

          <div className="flex shrink-0 items-center gap-0.5">
            {!boardLessonOpen && !boardTopCollapsed && voiceSupported && (
              <button
                type="button"
                onClick={startOrStopVoice}
                disabled={loading}
                className={clsx(
                  iconButtonClass,
                  isListening && 'bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white'
                )}
                aria-label={isListening ? 'Stop listening' : 'Voice teach — dictate equations and say solve'}
              >
                <Mic size={18} aria-hidden="true" />
              </button>
            )}
            {!boardLessonOpen && !boardTopCollapsed && canCancelVoice && (
              <button
                type="button"
                onClick={handleCancelVoice}
                className={iconButtonClass}
                aria-label="Cancel voice equation"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleFocusMode}
              className={iconButtonClass}
              aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
              title={focusMode ? 'Exit focus mode' : 'Focus mode'}
            >
              {focusMode ? <Minimize2 size={18} aria-hidden="true" /> : <Focus size={18} aria-hidden="true" />}
            </button>
            {!boardLessonOpen && !focusMode && (
              <button
                type="button"
                onClick={toggleBoardTopCollapsed}
                className={iconButtonClass}
                aria-label={boardTopCollapsed ? 'Show tutor controls' : 'Hide tutor controls'}
                title={boardTopCollapsed ? 'Show controls' : 'Hide controls'}
              >
                {boardTopCollapsed ? (
                  <ChevronDown size={18} aria-hidden="true" />
                ) : (
                  <ChevronUp size={18} aria-hidden="true" />
                )}
              </button>
            )}
            {tutorButton}
          </div>
        </div>
        {hearingStatus}
        {debugEnabled && isListening && (
          <VoiceMathDebugPanel events={debugEvents} equation={parsedEquation || hearingDisplay} />
        )}
      </div>
    );
  }

  if (focusMode) {
    return (
      <div className={barShellClass}>
        <div className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 p-2 shadow-md backdrop-blur">
          <div className="flex shrink-0 items-center gap-2">
            {boardLessonOpen ? (
              <button
                type="button"
                onClick={() => setBoardLessonOpen(false)}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-200 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                aria-label="Back to writing"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Back to writing
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={askTutor}
                  disabled={loading}
                  aria-label={loading ? 'Tutor is working' : 'Ask Tutor'}
                  className="flex min-h-[40px] items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-60"
                >
                  <Bot size={18} aria-hidden="true" />
                  {loading ? 'Working...' : 'Tutor'}
                </button>
                {hasAnswer && (
                  <button
                    type="button"
                    onClick={showAnswer}
                    aria-label="View answer"
                    className="flex min-h-[40px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    <BookOpen size={17} aria-hidden="true" />
                    View Answer
                  </button>
                )}
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-neutral-100 p-1">
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Ask a follow-up or new question..."
              disabled={loading}
              className="min-h-[38px] min-w-0 flex-1 bg-transparent px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              aria-label="Question for Tutor"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-40"
              aria-label="Send question"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-1">
            {voiceSupported && (
              <button
                type="button"
                onClick={startOrStopVoice}
                disabled={loading}
                className={`flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 ${
                  isListening ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Voice teach — dictate equations and say solve'}
              >
                <Mic size={17} aria-hidden="true" />
                {isListening ? 'Listening' : 'Voice'}
              </button>
            )}
            {canCancelVoice && (
              <button
                type="button"
                onClick={handleCancelVoice}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                aria-label="Cancel voice equation"
              >
                <X size={17} aria-hidden="true" />
                Cancel
              </button>
            )}

            {voiceOutputSupported && (
              <button
                type="button"
                onClick={toggleAutoSpeak}
                className={`flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
                  autoSpeak ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                aria-label={autoSpeak ? 'Turn automatic reading off' : 'Turn automatic reading on'}
                aria-pressed={autoSpeak}
              >
                {autoSpeak ? <Volume2 size={17} /> : <VolumeX size={17} />}
                Auto read
              </button>
            )}

            {voiceOutputSupported && (onSpeak || onStopSpeaking) && (
              <button
                type="button"
                onClick={isSpeaking ? onStopSpeaking : onSpeak}
                className="flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                aria-label={isSpeaking ? 'Stop reading response' : 'Read response aloud'}
              >
                {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
                {isSpeaking ? 'Stop' : 'Read aloud'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleFocusMode}
              className="flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="Exit focus mode"
              title="Exit focus mode (Esc)"
            >
              <Minimize2 size={17} aria-hidden="true" />
              Exit focus
            </button>
          </div>
        </div>

        {!boardTopCollapsed && (isListening || error) && (
          <div
            className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
              error ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-100 text-neutral-700'
            }`}
            role="status"
          >
            <span className="min-w-0 truncate">
              {error
                ? error
                : hearingDisplay
                  ? `Hearing: ${hearingDisplay}`
                  : 'Listening… speak at your pace, then say "solve".'}
            </span>
            {canCancelVoice && (
              <button
                type="button"
                onClick={handleCancelVoice}
                className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-neutral-700 hover:bg-white"
              >
                Cancel
              </button>
            )}
          </div>
        )}
        {debugEnabled && isListening && (
          <VoiceMathDebugPanel events={debugEvents} equation={parsedEquation || hearingDisplay} />
        )}
      </div>
    );
  }

  return (
    <div className={barShellClass}>
      {boardTopCollapsed ? (
        <div className="flex w-full items-center justify-end gap-2">
          {boardLessonOpen && (
            <button
              type="button"
              onClick={() => setBoardLessonOpen(false)}
              className={floatingButtonClass}
              aria-label="Back to writing"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Back to writing</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleFocusMode}
            className={floatingButtonClass}
            aria-label="Enter focus mode"
            title="Focus mode — hide chrome, enlarge lesson"
          >
            <Focus size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Focus</span>
          </button>
          <button
            type="button"
            onClick={toggleBoardTopCollapsed}
            className={floatingButtonClass}
            aria-label="Show tutor controls"
            title="Show tutor controls"
          >
            <ChevronDown size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Show controls</span>
          </button>
          <button
            type="button"
            onClick={askTutor}
            disabled={loading}
            className={tutorButtonClass}
            aria-label={loading ? 'Tutor is working' : 'Ask Tutor'}
          >
            <Bot size={17} aria-hidden="true" />
            <span>{loading ? 'Working...' : 'Tutor'}</span>
          </button>
        </div>
      ) : (
      <div className="flex w-full min-h-[56px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-lg backdrop-blur landscape-board:min-h-[44px] landscape-board:gap-2 landscape-board:p-1.5">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={askTutor}
            disabled={loading}
            aria-label={loading ? 'Tutor is working' : 'Ask Tutor'}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:opacity-60 landscape-board:min-h-[40px] landscape-board:px-3"
          >
            <Bot size={19} aria-hidden="true" />
            <span>{loading ? 'Working...' : 'Tutor'}</span>
          </button>

          {hasAnswer && !boardLessonOpen && (
            <button
              type="button"
              onClick={showAnswer}
              aria-label="View answer"
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <BookOpen size={18} aria-hidden="true" />
              <span className="hidden sm:inline">View Answer</span>
            </button>
          )}

          <div className="hidden w-[190px] sm:block landscape-board:hidden">
            <LearningLevelSelector />
          </div>

          {voiceOutputSupported && (
            <div className="hidden w-[145px] lg:block landscape-board:hidden">
              <SpeechVoiceSelector />
            </div>
          )}

          {voiceOutputSupported && (
            <div className="hidden w-[130px] md:block landscape-board:hidden">
              <SpeechSpeedSelector />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="hidden min-w-0 flex-1 items-center gap-1 rounded-xl bg-neutral-100 p-1 sm:flex landscape-board:hidden">
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Ask a question or use your writing..."
            disabled={loading}
            className="min-h-[40px] min-w-0 flex-1 bg-transparent px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            aria-label="Question for Tutor"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-40"
            aria-label="Send question"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleFocusMode}
            className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            aria-label="Enter focus mode"
            title="Focus mode — hide chrome, enlarge lesson"
          >
            <Focus size={18} aria-hidden="true" />
            <span className="hidden lg:inline">Focus</span>
          </button>
          <button
            type="button"
            onClick={toggleBoardTopCollapsed}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            aria-label="Hide tutor controls"
            title="Hide controls"
          >
            <ChevronUp size={20} aria-hidden="true" />
          </button>
          {voiceSupported && (
            <button
              type="button"
              onClick={startOrStopVoice}
              disabled={loading}
              className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 ${
                isListening
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Voice teach — dictate equations and say solve'}
            >
              <Mic size={18} aria-hidden="true" />
              <span className="hidden lg:inline">{isListening ? 'Listening' : 'Voice'}</span>
            </button>
          )}
          {canCancelVoice && (
            <button
              type="button"
              onClick={handleCancelVoice}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="Cancel voice equation"
            >
              <X size={18} aria-hidden="true" />
              <span className="hidden lg:inline">Cancel</span>
            </button>
          )}

          {voiceOutputSupported && (
            <button
              type="button"
              onClick={toggleAutoSpeak}
              className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
                autoSpeak ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-label={autoSpeak ? 'Turn automatic reading off' : 'Turn automatic reading on'}
              aria-pressed={autoSpeak}
            >
              {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span className="hidden lg:inline">Auto read</span>
            </button>
          )}

          {voiceOutputSupported && (onSpeak || onStopSpeaking) && (
            <button
              type="button"
              onClick={isSpeaking ? onStopSpeaking : onSpeak}
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label={isSpeaking ? 'Stop reading response' : 'Read response aloud'}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span className="hidden lg:inline">{isSpeaking ? 'Stop' : 'Read aloud'}</span>
            </button>
          )}
        </div>
      </div>
      )}
      {!boardTopCollapsed && (isListening || error) && (
        <div
          className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
            error ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-100 text-neutral-700'
          }`}
          role="status"
        >
          <span className="min-w-0 truncate">
            {error
              ? error
              : hearingDisplay
                ? `Hearing: ${hearingDisplay}`
                : 'Listening… speak at your pace, then say "solve".'}
          </span>
          {canCancelVoice && (
            <button
              type="button"
              onClick={handleCancelVoice}
              className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-neutral-700 hover:bg-white"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {debugEnabled && isListening && (
        <VoiceMathDebugPanel events={debugEvents} equation={parsedEquation || hearingDisplay} />
      )}
    </div>
  );
}
