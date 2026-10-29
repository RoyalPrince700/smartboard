import { Ruler, Shapes } from 'lucide-react';
import { DiagramAnalysis } from '../../types/geometry';
import { TutorAction, TutorActionBar, TutorActionId } from '../tutor/TutorActionBar';

interface DiagramAnalysisPanelProps {
  analysis: DiagramAnalysis;
  actions?: TutorAction[];
  onAction?: (id: TutorActionId) => void;
  loading?: boolean;
}

export function DiagramAnalysisPanel({
  analysis,
  actions = [],
  onAction,
  loading = false,
}: DiagramAnalysisPanelProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Shapes size={20} className="text-indigo-600" aria-hidden="true" />
          Let&apos;s examine the diagram
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {analysis.summary}
        </p>
      </div>

      {analysis.shapes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">
            Shapes we can see
        </h3>
          <ul className="space-y-2">
            {analysis.shapes.map((shape) => (
              <li key={shape.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-semibold capitalize text-indigo-700">{shape.type}</span>
                {shape.measurements.length > 0 && (
                  <span className="text-slate-500"> — {shape.measurements.map((m) => m.value).join(', ')}</span>
                )}
                {shape.labels.length > 0 && (
                  <span className="text-slate-500"> ({shape.labels.join(', ')})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.measurements.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Ruler size={17} className="text-indigo-500" aria-hidden="true" />
            Measurements
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {analysis.measurements.map((m, i) => (
              <li key={`${m.name}-${i}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                {m.name}: {m.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.explanation && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-slate-800">What this means</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{analysis.explanation}</p>
        </div>
      )}

      {onAction && (
        <TutorActionBar actions={actions} onAction={onAction} loading={loading} />
      )}
    </section>
  );
}
