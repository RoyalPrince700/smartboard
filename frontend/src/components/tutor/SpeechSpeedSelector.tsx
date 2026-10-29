import { Gauge } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';

export const SPEECH_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2×' },
] as const;

export function SpeechSpeedSelector() {
  const speechRate = useAIStore((state) => state.speechRate);
  const setSpeechRate = useAIStore((state) => state.setSpeechRate);
  const loading = useAIStore((state) => state.loading);

  return (
    <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-neutral-500">
      <Gauge size={16} aria-hidden="true" className="shrink-0 text-neutral-400" />
      <span className="shrink-0">Speed</span>
      <select
        value={speechRate}
        disabled={loading}
        onChange={(event) => setSpeechRate(Number(event.target.value))}
        className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-60"
        aria-label="Read aloud speed"
      >
        {SPEECH_SPEED_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
