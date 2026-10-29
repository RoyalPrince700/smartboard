import { UserRound } from 'lucide-react';
import { SpeechVoiceStyle, useAIStore } from '../../stores/aiStore';

const VOICE_STYLE_OPTIONS: Array<{ value: SpeechVoiceStyle; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export function SpeechVoiceSelector() {
  const speechVoiceStyle = useAIStore((state) => state.speechVoiceStyle);
  const setSpeechVoiceStyle = useAIStore((state) => state.setSpeechVoiceStyle);
  const loading = useAIStore((state) => state.loading);

  return (
    <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-neutral-500">
      <UserRound size={16} aria-hidden="true" className="shrink-0 text-neutral-400" />
      <span className="shrink-0">Voice</span>
      <select
        value={speechVoiceStyle}
        disabled={loading}
        onChange={(event) => setSpeechVoiceStyle(event.target.value as SpeechVoiceStyle)}
        className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-60"
        aria-label="Read aloud voice style"
      >
        {VOICE_STYLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
