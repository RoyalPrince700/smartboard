import { GraduationCap } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { EducationLevel } from '../../types/ai';

const LEVELS: { id: EducationLevel; label: string }[] = [
  { id: 'general', label: 'All levels' },
  { id: 'primary', label: 'Primary' },
  { id: 'junior_secondary', label: 'JSS' },
  { id: 'senior_secondary', label: 'SSS' },
  { id: 'university', label: 'Advanced' },
];

export function LearningLevelSelector() {
  const educationLevel = useAIStore((state) => state.educationLevel);
  const setEducationLevel = useAIStore((state) => state.setEducationLevel);
  const loading = useAIStore((state) => state.loading);

  return (
    <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-neutral-500">
      <GraduationCap size={16} aria-hidden="true" className="shrink-0 text-neutral-400" />
      <span className="shrink-0">Explain for</span>
      <select
        value={educationLevel}
        disabled={loading}
        onChange={(event) => setEducationLevel(event.target.value as EducationLevel)}
        className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-60"
        aria-label="Learning level"
      >
        {LEVELS.map((level) => (
          <option key={level.id} value={level.id}>
            {level.label}
          </option>
        ))}
      </select>
    </label>
  );
}
