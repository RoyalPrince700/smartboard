import { useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CancellationStrokeProps {
  containerRef: React.RefObject<HTMLElement | null>;
  tokenRefs: React.RefObject<Record<string, HTMLSpanElement | null>>;
  targetTokenId: string;
  delay?: number;
}

/** Handwritten-style diagonal strike overlay — not part of the equation text. */
export function CancellationStroke({
  containerRef,
  tokenRefs,
  targetTokenId,
  delay = 0,
}: CancellationStrokeProps) {
  const [geometry, setGeometry] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const target = tokenRefs.current?.[targetTokenId] ?? null;
      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const padX = Math.max(4, targetRect.width * 0.08);
      const padY = Math.max(3, targetRect.height * 0.12);

      const left = targetRect.left - containerRect.left - padX;
      const right = targetRect.right - containerRect.left + padX;
      const top = targetRect.top - containerRect.top + padY;
      const bottom = targetRect.bottom - containerRect.top - padY;

      setGeometry({
        x1: left,
        y1: bottom,
        x2: right,
        y2: top,
      });
    };

    measure();
    const raf = requestAnimationFrame(measure);

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    const target = tokenRefs.current?.[targetTokenId] ?? null;
    if (target) observer.observe(target);

    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, tokenRefs, targetTokenId]);

  if (!geometry) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      <motion.line
        x1={geometry.x1}
        y1={geometry.y1}
        initial={{ x2: geometry.x1, y2: geometry.y1, opacity: 0.85 }}
        animate={{ x2: geometry.x2, y2: geometry.y2, opacity: 1 }}
        transition={{
          x2: { duration: 0.42, delay, ease: [0.33, 0.08, 0.2, 1] },
          y2: { duration: 0.42, delay, ease: [0.33, 0.08, 0.2, 1] },
          opacity: { duration: 0.12, delay },
        }}
        stroke="#dc2626"
        strokeWidth={3.5}
        strokeLinecap="round"
        style={{
          filter: 'drop-shadow(0 0 0.5px rgba(220, 38, 38, 0.35))',
        }}
      />
    </svg>
  );
}
