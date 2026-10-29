import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MathExpression } from '../math/MathExpression';
import { AnnotatedEquationLine } from '../math/AnnotatedEquationLine';
import { useAIStore } from '../../stores/aiStore';
import type { AnnotatedEquation } from '../../types/equationAnnotation';

interface TutorStepCardProps {
  number: number;
  title: string;
  explanation?: string;
  equations: string[];
  annotatedEquations?: AnnotatedEquation[];
  latex?: string;
  why?: string;
  index?: number;
  displayMode?: 'panel' | 'board';
  isNarrating?: boolean;
  activeEquationIndex?: number;
  activeTokenIndex?: number;
}

export function TutorStepCard({
  number,
  title,
  explanation,
  equations,
  annotatedEquations,
  latex,
  why,
  index = 0,
  displayMode = 'panel',
  isNarrating = false,
  activeEquationIndex,
  activeTokenIndex,
}: TutorStepCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const focusMode = useAIStore((state) => state.focusMode);
  const isFocusBoard = displayMode === 'board' && focusMode;
  const isBoard = displayMode === 'board';
  const rationale = why || explanation;
  const cardRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isNarrating) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isNarrating]);

  const equationLines: AnnotatedEquation[] =
    annotatedEquations ??
    equations.map((text) => ({
      text,
    }));

  return (
    <motion.li
      ref={cardRef}
      id={`tutor-step-${number}`}
      initial={{ opacity: 0, y: 12 }}
      animate={
        isNarrating
          ? {
              opacity: 1,
              y: 0,
              scale: 1.012,
              boxShadow: '0 18px 45px rgba(79, 70, 229, 0.18)',
            }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            }
      }
      transition={
        isNarrating
          ? { type: 'spring', stiffness: 240, damping: 20 }
          : { delay: index * 0.12, duration: 0.32 }
      }
      className={`overflow-hidden rounded-2xl border bg-white ${
        isFocusBoard
          ? 'border-transparent shadow-none'
          : isNarrating
            ? 'border-indigo-400 ring-4 ring-indigo-100'
            : 'border-slate-200'
      }`}
    >
      <div className={`flex gap-4 ${isFocusBoard ? 'p-2 sm:p-4' : isBoard ? 'p-6' : 'p-4'}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white ${
          isFocusBoard ? 'h-10 w-10 text-base' : isBoard ? 'h-11 w-11 text-lg' : 'h-8 w-8 text-sm'
        }`}>
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold leading-snug text-slate-800 ${
            isFocusBoard
              ? 'text-xl sm:text-2xl'
              : isBoard
                ? 'text-xl sm:text-2xl'
                : ''
          }`}>{title}</p>
          {explanation && (
            <p className={`mt-2 whitespace-pre-line leading-relaxed text-slate-600 ${
              isFocusBoard
                ? 'text-lg sm:text-xl'
                : isBoard
                  ? 'text-base sm:text-lg'
                  : 'text-sm'
            }`}>{explanation}</p>
          )}
          {equationLines.length > 0 && (
            <div className={`${explanation ? 'mt-4' : 'mt-2'} space-y-2`}>
              {equationLines.map((equation, equationIndex) => (
                <div
                  key={`${number}-${equationIndex}`}
                  className={`text-center font-bold text-slate-900 ${
                    isFocusBoard
                      ? 'px-4 py-6 text-4xl sm:text-5xl lg:text-6xl'
                      : isBoard
                        ? 'rounded-xl border border-slate-100 bg-slate-50 px-5 py-5 text-3xl sm:text-4xl lg:text-5xl'
                        : 'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-base font-semibold'
                  }`}
                >
                  {equation.cancellations?.length ? (
                    <AnnotatedEquationLine
                      equation={equation}
                      block
                      animateCancellations
                    />
                  ) : (
                    <MathExpression
                      text={equation.text}
                      latex={equationIndex === equationLines.length - 1 ? latex : undefined}
                      block
                      activeTokenIndex={
                        equationIndex === activeEquationIndex ? activeTokenIndex : undefined
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {rationale && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setWhyOpen((open) => !open)}
            aria-expanded={whyOpen}
            className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
          >
            <CircleHelp size={16} aria-hidden="true" />
            Why?
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`ml-auto transition-transform ${whyOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {whyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="border-t border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950">
                  {rationale}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.li>
  );
}

export function FinalAnswerCard({
  answer,
  delay = 0,
  displayMode = 'panel',
  isNarrating = false,
}: {
  answer: string;
  delay?: number;
  displayMode?: 'panel' | 'board';
  isNarrating?: boolean;
}) {
  const focusMode = useAIStore((state) => state.focusMode);
  const isFocusBoard = displayMode === 'board' && focusMode;
  const isBoard = displayMode === 'board';
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isNarrating) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isNarrating]);

  return (
    <motion.section
      ref={cardRef}
      id="tutor-step-answer"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={
        isNarrating
          ? {
              opacity: 1,
              scale: [1, 1.035, 1.015],
              boxShadow: '0 22px 55px rgba(16, 185, 129, 0.24)',
            }
          : { opacity: 1, scale: 1, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)' }
      }
      transition={
        isNarrating
          ? { duration: 0.8, ease: 'easeOut' }
          : { delay, type: 'spring', stiffness: 220, damping: 20 }
      }
      className={`overflow-hidden rounded-2xl border bg-emerald-50 ${
        isFocusBoard
          ? 'border-transparent shadow-none'
          : isNarrating
            ? 'border-emerald-400 ring-4 ring-emerald-100'
            : 'border-emerald-200'
      }`}
      aria-label="Final answer"
    >
      <div className={`border-b border-emerald-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 ${
        isFocusBoard ? 'border-transparent text-center text-sm' : ''
      }`}>
        Final answer
      </div>
      <div className={`text-center font-bold text-emerald-900 ${
        isFocusBoard
          ? 'px-4 py-10 text-4xl sm:text-5xl lg:text-6xl'
          : isBoard
            ? 'px-6 py-8 text-3xl sm:text-4xl'
            : 'px-4 py-5 text-2xl'
      }`}>
        <MathExpression text={answer} block />
      </div>
    </motion.section>
  );
}
