import { useEffect, useState } from 'react';

export function useRevealSequence(stepCount: number, resetKey: string, delayMs = 520) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    setVisibleSteps(0);
    setShowAnswer(false);
    setShowGraph(false);

    const timers: number[] = [];
    for (let i = 1; i <= stepCount; i++) {
      timers.push(window.setTimeout(() => setVisibleSteps(i), i * delayMs));
    }

    timers.push(window.setTimeout(() => setShowAnswer(true), (stepCount + 1) * delayMs));
    timers.push(window.setTimeout(() => setShowGraph(true), (stepCount + 1.65) * delayMs));

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [stepCount, resetKey, delayMs]);

  return { visibleSteps, showAnswer, showGraph };
}
