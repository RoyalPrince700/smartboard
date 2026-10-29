import {
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardPen,
  ListChecks,
  MonitorUp,
  Shapes,
  Sparkles,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type TutorActionId =
  | 'explain-more'
  | 'give-example'
  | 'quiz-me'
  | 'simplify'
  | 'try-one'
  | 'show-graph'
  | 'show-diagram'
  | 'show-on-board';

export interface TutorAction {
  id: TutorActionId;
  label: string;
  disabled?: boolean;
  hint?: string;
}

const ICONS: Record<TutorActionId, LucideIcon> = {
  'explain-more': BookOpen,
  'give-example': Sparkles,
  'quiz-me': ListChecks,
  simplify: BrainCircuit,
  'try-one': ClipboardPen,
  'show-graph': ChartNoAxesCombined,
  'show-diagram': Shapes,
  'show-on-board': MonitorUp,
};

interface TutorActionBarProps {
  actions: TutorAction[];
  onAction: (id: TutorActionId) => void;
  loading?: boolean;
  floating?: boolean;
}

export function TutorActionBar({ actions, onAction, loading = false, floating = false }: TutorActionBarProps) {
  if (actions.length === 0) return null;

  if (floating) {
    return (
      <section
        className="pointer-events-none sticky bottom-4 z-10 pt-6"
        aria-label="Tutor actions"
      >
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-lg backdrop-blur">
          {actions.map((action) => {
            const Icon = ICONS[action.id];
            const isDisabled = loading || action.disabled;
            return (
              <button
                key={action.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onAction(action.id)}
                title={action.hint}
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
              >
                <Icon size={16} aria-hidden="true" />
                {action.label}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-200 pt-4" aria-label="Tutor actions">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        <CircleHelp size={14} aria-hidden="true" />
        What next?
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = ICONS[action.id];
          const isDisabled = loading || action.disabled;
          return (
            <button
              key={action.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onAction(action.id)}
              title={action.hint}
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
            >
              <Icon size={16} aria-hidden="true" />
              {action.label}
              {action.disabled && (
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
