import { useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { AnnotatedEquation } from '../../types/equationAnnotation';
import {
  parseEquationTokens,
  resolveCancellationTokens,
} from '../../utils/equationCancellation';
import { FractionText } from './FractionText';
import { CancellationStroke } from './CancellationStroke';

interface AnnotatedEquationLineProps {
  equation: AnnotatedEquation;
  block?: boolean;
  className?: string;
  animateCancellations?: boolean;
}

function hasFractionMarkers(text: string): boolean {
  return /\[FRAC:/.test(text);
}

export function AnnotatedEquationLine({
  equation,
  block = false,
  className,
  animateCancellations = true,
}: AnnotatedEquationLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const displayText = equation.text;
  const { left, right } = useMemo(
    () => parseEquationTokens(displayText),
    [displayText]
  );

  const resolvedCancellations = useMemo(
    () => resolveCancellationTokens(displayText, equation.cancellations),
    [displayText, equation.cancellations]
  );

  const registerTokenRef = useCallback((id: string) => {
    return (el: HTMLSpanElement | null) => {
      tokenRefs.current[id] = el;
    };
  }, []);

  const showArrow = displayText.startsWith('→');
  const useTokenLayout = left.length > 0 || right.length > 0;

  if (!useTokenLayout) {
    const body = showArrow ? displayText.slice(1).trim() : displayText;
    return (
      <span className={clsx(block && 'block', className)}>
        {showArrow && <span className="mr-2 text-indigo-600">→</span>}
        {hasFractionMarkers(body) ? <FractionText text={body} /> : body}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1',
        block && 'w-full',
        className
      )}
      aria-label={displayText.replace(/\[FRAC:[^\]]+\]/g, '')}
    >
      {showArrow && <span className="text-indigo-600">→</span>}

      <div className="inline-flex flex-wrap items-center justify-center gap-x-2">
        {left.map((token) => (
          <span key={token.id} ref={registerTokenRef(token.id)} className="inline-block px-0.5">
            {hasFractionMarkers(token.text) ? (
              <FractionText text={token.text} />
            ) : (
              token.text
            )}
          </span>
        ))}
      </div>

      <span className="px-0.5">=</span>

      <div className="inline-flex flex-wrap items-center justify-center gap-x-2">
        {right.map((token) => (
          <span key={token.id} ref={registerTokenRef(token.id)} className="inline-block px-0.5">
            {hasFractionMarkers(token.text) ? (
              <FractionText text={token.text} />
            ) : (
              token.text
            )}
          </span>
        ))}
      </div>

      {resolvedCancellations.map(({ token }, index) => (
        <CancellationStroke
          key={token.id}
          containerRef={containerRef}
          tokenRefs={tokenRefs}
          targetTokenId={token.id}
          delay={animateCancellations ? index * 0.18 : 0}
        />
      ))}
    </div>
  );
}
