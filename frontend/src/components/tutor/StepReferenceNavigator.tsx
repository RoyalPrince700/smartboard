import clsx from 'clsx';
import { CheckCircle2 } from 'lucide-react';
import { MathExpression } from '../math/MathExpression';
import { useAIStore } from '../../stores/aiStore';
import type { MathStep } from '../../types/math';
import { getStepReferenceFormula } from '../../utils/mathPresentation';
import {
  scrollToStepTarget,
  useStepScrollSpy,
  type StepNavTarget,
} from '../../hooks/useStepScrollSpy';
import type { RefObject } from 'react';

interface StepReferenceNavigatorProps {
  steps: MathStep[];
  answer: string;
  scrollRef: RefObject<HTMLElement | null>;
  lessonKey?: number;
  className?: string;
}

function truncateTitle(title: string, maxLength = 28): string {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 1).trim()}…`;
}

function isTargetActive(
  target: StepNavTarget,
  visibleTarget: StepNavTarget | null,
  narrationFocus: ReturnType<typeof useAIStore.getState>['narrationFocus']
): boolean {
  if (narrationFocus?.kind === 'question' && target === 'question') return true;
  if (narrationFocus?.kind === 'answer' && target === 'answer') return true;
  if (
    narrationFocus?.kind === 'step' &&
    typeof target === 'number' &&
    narrationFocus.step === target
  ) {
    return true;
  }
  return visibleTarget === target;
}

export function StepReferenceNavigator({
  steps,
  answer,
  scrollRef,
  lessonKey = 0,
  className,
}: StepReferenceNavigatorProps) {
  const setNarrationFocus = useAIStore((state) => state.setNarrationFocus);
  const narrationFocus = useAIStore((state) => state.narrationFocus);

  const visibleTarget = useStepScrollSpy({
    scrollRef,
    stepCount: steps.length,
    enabled: steps.length > 0,
    resetKey: lessonKey,
  });

  const handleSelect = (target: StepNavTarget) => {
    scrollToStepTarget(scrollRef, target);
    if (target === 'question') {
      setNarrationFocus({ kind: 'question' });
    } else if (target === 'answer') {
      setNarrationFocus({ kind: 'answer' });
    } else {
      setNarrationFocus({ kind: 'step', step: target });
    }
  };

  if (steps.length === 0) return null;

  return (
    <nav
      className={clsx(
        'hidden min-h-0 w-[min(100%,13.5rem)] shrink-0 flex-col border-l border-slate-200 bg-white/95 backdrop-blur md:flex lg:w-56 xl:w-60',
        className
      )}
      aria-label="Step references"
    >
      <div className="shrink-0 border-b border-slate-100 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Steps
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Jump to any part</p>
      </div>

      <ol className="step-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
        {steps.map((step) => {
          const { formula, latex } = getStepReferenceFormula(step);
          const active = isTargetActive(step.step, visibleTarget, narrationFocus);

          return (
            <li key={step.step} className="relative px-2">
              <button
                type="button"
                onClick={() => handleSelect(step.step)}
                aria-current={active ? 'step' : undefined}
                className={clsx(
                  'group flex w-full flex-col gap-1 rounded-xl px-2.5 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-400',
                  active
                    ? 'bg-indigo-50 ring-1 ring-indigo-200'
                    : 'hover:bg-slate-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                    )}
                  >
                    {step.step}
                  </span>
                  <span
                    className={clsx(
                      'min-w-0 flex-1 text-xs font-semibold leading-tight',
                      active ? 'text-indigo-900' : 'text-slate-700'
                    )}
                  >
                    {truncateTitle(step.title)}
                  </span>
                </span>
                <div
                  className={clsx(
                    'overflow-hidden rounded-lg border px-2 py-1.5 text-center text-[11px] leading-tight',
                    active
                      ? 'border-indigo-100 bg-white text-indigo-950'
                      : 'border-slate-100 bg-slate-50 text-slate-800'
                  )}
                >
                  <MathExpression text={formula} latex={latex} block className="!text-[11px]" />
                </div>
              </button>
            </li>
          );
        })}

        <li className="relative px-2">
          <button
            type="button"
            onClick={() => handleSelect('answer')}
            aria-current={
              isTargetActive('answer', visibleTarget, narrationFocus) ? 'step' : undefined
            }
            className={clsx(
              'group flex w-full flex-col gap-1 rounded-xl px-2.5 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400',
              isTargetActive('answer', visibleTarget, narrationFocus)
                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                : 'hover:bg-slate-50'
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  isTargetActive('answer', visibleTarget, narrationFocus)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                )}
              >
                <CheckCircle2 size={14} aria-hidden="true" />
              </span>
              <span
                className={clsx(
                  'text-xs font-semibold',
                  isTargetActive('answer', visibleTarget, narrationFocus)
                    ? 'text-emerald-900'
                    : 'text-slate-700'
                )}
              >
                Final answer
              </span>
            </span>
            <div
              className={clsx(
                'overflow-hidden rounded-lg border px-2 py-1.5 text-center text-[11px] leading-tight',
                isTargetActive('answer', visibleTarget, narrationFocus)
                  ? 'border-emerald-100 bg-white text-emerald-950'
                  : 'border-slate-100 bg-slate-50 text-slate-800'
              )}
            >
              <MathExpression text={answer} block className="!text-[11px]" />
            </div>
          </button>
        </li>
      </ol>
    </nav>
  );
}
