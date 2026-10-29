import { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronLeft, ChevronRight, Mic, Send, Volume2, VolumeX } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useAIStore } from '../../stores/aiStore';
import { LearningLevelSelector } from '../tutor/LearningLevelSelector';
import { SpeechVoiceSelector } from '../tutor/SpeechVoiceSelector';
import { TutorActionId } from '../tutor/TutorActionBar';
import { AIResponsePanel } from './AIResponsePanel';

interface BoardRightRailProps {
  onAsk: () => void;
  onVoiceAsk: (text: string) => void;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  voiceOutputSupported?: boolean;
  onTutorAction: (id: TutorActionId) => void;
}

export function BoardRightRail({
  onAsk,
  onVoiceAsk,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  voiceOutputSupported,
  onTutorAction,
}: BoardRightRailProps) {
  const inputText = useAIStore((s) => s.inputText);
  const setInputText = useAIStore((s) => s.setInputText);
  const loading = useAIStore((s) => s.loading);
  const railCollapsed = useAIStore((s) => s.railCollapsed);
  const toggleRail = useAIStore((s) => s.toggleRail);
  const autoSpeak = useAIStore((s) => s.autoSpeak);
  const toggleAutoSpeak = useAIStore((s) => s.toggleAutoSpeak);

  const { supported: voiceSupported, isListening, toggleListening } = useVoiceInput({
    onFinalTranscript: (text) => {
      setInputText(text);
      onVoiceAsk(text);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAsk();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: railCollapsed ? 64 : 'clamp(300px, 34vw, 420px)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-30 flex shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-[-10px_0_30px_rgba(15,23,42,0.08)]"
      aria-label="Tutor panel"
    >
      {railCollapsed ? (
        <div className="flex h-full flex-col items-center gap-3 py-3">
          <button
            type="button"
            onClick={toggleRail}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            aria-label="Open Tutor"
            title="Open Tutor"
          >
            <Bot size={21} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleRail}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Expand Tutor panel"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="mt-auto flex flex-col gap-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 ${
                  isListening ? 'bg-rose-100 text-rose-600' : 'text-slate-500 hover:bg-white'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Ask Tutor by voice'}
              >
                <Mic size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Bot size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold leading-tight text-slate-900">Tutor</h1>
                <p className="truncate text-xs text-slate-500">Your teaching assistant</p>
              </div>
              <div className="flex items-center gap-1">
                {voiceOutputSupported && (
                  <button
                    type="button"
                    onClick={toggleAutoSpeak}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      autoSpeak
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    aria-label={autoSpeak ? 'Turn automatic reading off' : 'Turn automatic reading on'}
                    aria-pressed={autoSpeak}
                    title={autoSpeak ? 'Auto-read is on' : 'Auto-read is off'}
                  >
                    {autoSpeak ? <Volume2 size={19} /> : <VolumeX size={19} />}
                  </button>
                )}
                {voiceOutputSupported && (onSpeak || onStopSpeaking) && (
                  <button
                    type="button"
                    onClick={isSpeaking ? onStopSpeaking : onSpeak}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    aria-label={isSpeaking ? 'Stop reading response' : 'Read response aloud'}
                    title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  >
                    {isSpeaking ? <VolumeX size={19} /> : <Volume2 size={19} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleRail}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  aria-label="Collapse Tutor panel"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <LearningLevelSelector />
            </div>
            {voiceOutputSupported && (
              <div className="mt-2">
                <SpeechVoiceSelector />
              </div>
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            <AIResponsePanel
              embedded
              onSpeak={onSpeak}
              onStopSpeaking={onStopSpeaking}
              isSpeaking={isSpeaking}
              voiceOutputSupported={voiceOutputSupported}
              onTutorAction={onTutorAction}
            />
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-within focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                type="text"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Ask Tutor anything..."
                disabled={loading}
                className="min-h-[44px] min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                aria-label="Question for Tutor"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 ${
                    isListening
                      ? 'bg-rose-100 text-rose-600'
                      : 'text-slate-500 hover:bg-white hover:text-indigo-600'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Ask Tutor by voice'}
                >
                  <Mic size={19} aria-hidden="true" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
            {isListening && (
              <p className="mt-2 animate-pulse px-2 text-xs font-medium text-rose-600" role="status">
                Listening...
              </p>
            )}
          </form>
        </>
      )}
    </motion.aside>
  );
}
