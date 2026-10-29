import { useEffect, useState, type RefObject } from 'react';

export type StepNavTarget = 'question' | number | 'answer';

interface UseStepScrollSpyOptions {
  scrollRef: RefObject<HTMLElement | null>;
  stepCount: number;
  enabled?: boolean;
  /** Bump when lesson content remounts so observers reattach. */
  resetKey?: number;
}

function readVisibleTarget(
  container: HTMLElement,
  stepCount: number
): StepNavTarget | null {
  const containerRect = container.getBoundingClientRect();
  const viewportCenter = containerRect.top + containerRect.height * 0.35;

  const candidates: { target: StepNavTarget; distance: number }[] = [];

  const questionEl = container.querySelector<HTMLElement>('[data-step-nav="question"]');
  if (questionEl) {
    const rect = questionEl.getBoundingClientRect();
    candidates.push({
      target: 'question',
      distance: Math.abs(rect.top + rect.height / 2 - viewportCenter),
    });
  }

  for (let step = 1; step <= stepCount; step += 1) {
    const el = container.querySelector<HTMLElement>(`#tutor-step-${step}`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    candidates.push({
      target: step,
      distance: Math.abs(rect.top + rect.height / 2 - viewportCenter),
    });
  }

  const answerEl = container.querySelector<HTMLElement>('#tutor-step-answer');
  if (answerEl) {
    const rect = answerEl.getBoundingClientRect();
    candidates.push({
      target: 'answer',
      distance: Math.abs(rect.top + rect.height / 2 - viewportCenter),
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].target;
}

export function useStepScrollSpy({
  scrollRef,
  stepCount,
  enabled = true,
  resetKey = 0,
}: UseStepScrollSpyOptions) {
  const [visibleTarget, setVisibleTarget] = useState<StepNavTarget | null>(null);

  useEffect(() => {
    if (!enabled || stepCount === 0) {
      setVisibleTarget(null);
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      setVisibleTarget(readVisibleTarget(container, stepCount));
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    container.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      container.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [scrollRef, stepCount, enabled, resetKey]);

  return visibleTarget;
}

export function scrollToStepTarget(
  scrollRef: RefObject<HTMLElement | null>,
  target: StepNavTarget
) {
  const container = scrollRef.current;
  if (!container) return;

  const selector =
    target === 'question'
      ? '[data-step-nav="question"]'
      : target === 'answer'
        ? '#tutor-step-answer'
        : `#tutor-step-${target}`;

  const el = container.querySelector<HTMLElement>(selector);
  if (!el) return;

  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offset = elRect.top - containerRect.top + container.scrollTop - containerRect.height * 0.25;

  container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
}
