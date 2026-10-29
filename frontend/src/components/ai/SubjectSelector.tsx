import clsx from 'clsx';
import { SUBJECTS } from '../../types/ai';
import { useAIStore } from '../../stores/aiStore';

export function SubjectSelector() {
  const selectedSubject = useAIStore((s) => s.selectedSubject);
  const setSelectedSubject = useAIStore((s) => s.setSelectedSubject);
  const loading = useAIStore((s) => s.loading);

  return (
    <div className="flex flex-wrap gap-1">
      {SUBJECTS.map((subject) => (
        <button
          key={subject.id}
          type="button"
          disabled={loading}
          onClick={() => setSelectedSubject(subject.id)}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-medium touch-manipulation transition-all',
            selectedSubject === subject.id
              ? 'text-white ring-2 ring-white/30'
              : 'bg-board-toolbar text-white/60 hover:text-white'
          )}
          style={
            selectedSubject === subject.id
              ? { backgroundColor: subject.color }
              : undefined
          }
          title={subject.id === 'general' ? 'Auto-detect subject' : subject.label}
        >
          {subject.label}
        </button>
      ))}
    </div>
  );
}

export function SubjectBadge({ subject, intent }: { subject: string; intent?: string }) {
  const color = SUBJECTS.find((s) => s.id === subject)?.color ?? '#888';

  return (
    <div className="flex flex-wrap gap-2">
      <span
        className="px-2 py-1 rounded-lg text-xs font-medium text-white"
        style={{ backgroundColor: `${color}33`, color }}
      >
        {SUBJECTS.find((s) => s.id === subject)?.label ?? subject}
      </span>
      {intent && (
        <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {intent}
        </span>
      )}
    </div>
  );
}
