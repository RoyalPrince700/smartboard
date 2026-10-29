import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { figureLabel, parseCountingScene, type CountingFigure } from '../../utils/objectArithmetic';

interface ObjectArithmeticSceneProps {
  expression: string;
}

const IDLE: Record<
  CountingFigure['id'],
  {
    animate: { y?: number[]; x?: number[]; rotate?: number[]; scale?: number[] };
    duration: number;
    origin: string;
  }
> = {
  egg: {
    animate: { rotate: [-8, 8, -5, 7, -8], y: [0, -3, 0, -2, 0] },
    duration: 2.1,
    origin: 'center bottom',
  },
  pencil: {
    animate: { rotate: [-7, 6, -4, 7, -7] },
    duration: 1.9,
    origin: 'center bottom',
  },
  house: {
    animate: { y: [0, -5, 0, -3, 0] },
    duration: 2.2,
    origin: 'center bottom',
  },
  car: {
    animate: { x: [0, 7, 0, 5, 0], rotate: [0, -2, 1, -1, 0] },
    duration: 1.7,
    origin: 'center',
  },
  apple: {
    animate: { y: [0, -8, 0, -5, 0], rotate: [-5, 5, -3, 4, -5] },
    duration: 1.8,
    origin: 'center bottom',
  },
  balloon: {
    animate: { y: [0, -14, -6, -16, 0], rotate: [-7, 7, -5, 6, -7] },
    duration: 2.6,
    origin: 'center',
  },
  flower: {
    animate: { rotate: [-8, 8, -6, 7, -8] },
    duration: 2.3,
    origin: 'center bottom',
  },
  star: {
    animate: { rotate: [0, 16, -12, 10, 0], scale: [1, 1.14, 0.96, 1.08, 1] },
    duration: 1.5,
    origin: 'center',
  },
};

function iconClass(count: number): string {
  if (count <= 3) return 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]';
  if (count <= 6) return 'h-14 w-14 sm:h-16 sm:w-16';
  return 'h-11 w-11 sm:h-12 sm:w-12';
}

function FigureImage({
  figure,
  className,
  delay,
  playKey,
  removed = false,
}: {
  figure: CountingFigure;
  className: string;
  delay: number;
  playKey: number;
  removed?: boolean;
}) {
  const reduce = useReducedMotion();
  const idle = IDLE[figure.id];
  const entrance = reduce
    ? { opacity: removed ? 0.4 : 1 }
    : removed
      ? { opacity: 0.4, scale: 1, y: 0, rotate: [0, -14, 12, -8, 6, 0] }
      : { opacity: 1, scale: 1, y: 0, rotate: 0 };

  return (
    <motion.span
      key={`${playKey}-${figure.id}-${delay}`}
      className="relative inline-flex"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.2, y: 28, rotate: -14 }}
      animate={entrance}
      whileHover={reduce ? undefined : { scale: 1.14 }}
      whileTap={reduce ? undefined : { scale: 1.26 }}
      transition={
        reduce
          ? { duration: 0.15 }
          : removed
            ? {
                default: { type: 'spring', stiffness: 520, damping: 14, delay },
                opacity: { delay: delay + 0.42, duration: 0.2 },
                rotate: { delay: delay + 0.32, duration: 0.45 },
              }
            : { type: 'spring', stiffness: 520, damping: 13, delay }
      }
    >
      <motion.img
        src={`/counting-figures/${figure.id}.png`}
        alt=""
        draggable={false}
        animate={reduce || removed ? undefined : idle.animate}
        transition={{
          duration: idle.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.55,
        }}
        style={{ transformOrigin: idle.origin }}
        className={`${className} object-contain`}
      />
      {removed && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.7, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={
            reduce
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 560, damping: 14, delay: delay + 0.5 }
          }
          className="pointer-events-none absolute inset-[18%] text-rose-600"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M18 18 L82 82 M82 18 L18 82"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
        </motion.span>
      )}
    </motion.span>
  );
}

function FigureRow({
  count,
  figure,
  playKey,
  startDelay = 0,
  removedFrom,
}: {
  count: number;
  figure: CountingFigure;
  playKey: number;
  startDelay?: number;
  removedFrom?: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-1">
      {Array.from({ length: count }, (_, index) => {
        const removed = removedFrom !== undefined && index >= removedFrom;
        return (
          <FigureImage
            key={`${playKey}-${index}`}
            figure={figure}
            className={iconClass(count)}
            delay={startDelay + index * 0.08}
            playKey={playKey}
            removed={removed}
          />
        );
      })}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-[7rem] flex-col items-center gap-2">
      {children}
      <p className="text-sm font-bold text-stone-700">{label}</p>
    </div>
  );
}

function Operator({
  children,
  playKey,
  delay = 0.16,
}: {
  children: string;
  playKey: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={`${playKey}-${children}`}
      aria-hidden="true"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.15, rotate: -20 }}
      animate={{ opacity: 1, scale: [1, 1.18, 1], rotate: 0 }}
      transition={
        reduce
          ? { duration: 0.15 }
          : {
              default: { type: 'spring', stiffness: 480, damping: 12, delay },
              scale: { delay: delay + 0.25, duration: 0.35 },
            }
      }
      className="px-1 text-3xl font-bold text-rose-500 sm:text-4xl"
    >
      {children}
    </motion.span>
  );
}

function PopGroup({
  playKey,
  delay,
  children,
}: {
  playKey: number;
  delay: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={`${playKey}-pop-${delay}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.72, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 420, damping: 15, delay }
      }
      className="rounded-2xl border border-amber-200 bg-white/80 px-2 py-2"
    >
      {children}
    </motion.div>
  );
}

export function ObjectArithmeticScene({ expression }: ObjectArithmeticSceneProps) {
  const scene = parseCountingScene(expression);
  const [playKey, setPlayKey] = useState(0);
  if (!scene) return null;

  const { left, right, op, result, leftFigure, rightFigure } = scene;
  const leftLabel = figureLabel(left, leftFigure);
  const rightLabel = figureLabel(right, rightFigure);

  let story = `${leftLabel} plus ${rightLabel} makes ${result} altogether`;
  if (op === '-') story = `Start with ${leftLabel}. Take away ${right}. ${figureLabel(result, leftFigure)} left`;
  if (op === '*') story = `${left} groups of ${rightLabel} makes ${figureLabel(result, leftFigure)}`;
  if (op === '/') {
    story = `${leftLabel} shared into ${right} equal groups, with ${result} in each group`;
  }

  return (
    <figure
      className="rounded-3xl border border-amber-200 bg-[#fffaf3] px-4 py-5 shadow-sm sm:px-6"
      aria-label={story}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-500">Picture it</p>
        <button
          type="button"
          onClick={() => setPlayKey((value) => value + 1)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          Watch again
        </button>
      </div>

      {op === '+' && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          <Group label={leftLabel}>
            <FigureRow count={left} figure={leftFigure} playKey={playKey} />
          </Group>
          <Operator playKey={playKey}>+</Operator>
          <Group label={rightLabel}>
            <FigureRow count={right} figure={rightFigure} playKey={playKey} startDelay={0.2} />
          </Group>
          <Operator playKey={playKey} delay={0.34}>=</Operator>
          <Group label={`${result} altogether`}>
            <div className="flex flex-wrap items-end justify-center gap-1">
              {Array.from({ length: left }, (_, index) => (
                <FigureImage
                  key={`${playKey}-sum-a-${index}`}
                  figure={leftFigure}
                  className={iconClass(result)}
                  delay={0.48 + index * 0.07}
                  playKey={playKey}
                />
              ))}
              {Array.from({ length: right }, (_, index) => (
                <FigureImage
                  key={`${playKey}-sum-b-${index}`}
                  figure={rightFigure}
                  className={iconClass(result)}
                  delay={0.48 + (left + index) * 0.07}
                  playKey={playKey}
                />
              ))}
            </div>
          </Group>
        </div>
      )}

      {op === '-' && (
        <div className="flex flex-col items-center gap-4">
          <Group label={leftLabel}>
            <FigureRow
              count={left}
              figure={leftFigure}
              playKey={playKey}
              removedFrom={left - right}
            />
          </Group>
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 380, damping: 16 }}
            className="text-sm font-bold text-rose-600"
          >
            Take away {right}
          </motion.p>
          <Operator playKey={playKey} delay={0.45}>=</Operator>
          <Group label={`${figureLabel(result, leftFigure)} left`}>
            {result === 0 ? (
              <p className="text-base font-bold text-stone-500">None left</p>
            ) : (
              <FigureRow count={result} figure={leftFigure} playKey={playKey} startDelay={0.55} />
            )}
          </Group>
        </div>
      )}

      {op === '*' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-bold text-stone-700">
            {left} {left === 1 ? 'group' : 'groups'} of {rightLabel}
          </p>
          <div className="flex flex-wrap items-end justify-center gap-3">
            {Array.from({ length: left }, (_, group) => (
              <PopGroup key={`${playKey}-group-${group}`} playKey={playKey} delay={group * 0.14}>
                <FigureRow
                  count={right}
                  figure={leftFigure}
                  playKey={playKey}
                  startDelay={group * 0.14}
                />
              </PopGroup>
            ))}
          </div>
          <Operator playKey={playKey} delay={0.2 + left * 0.14}>=</Operator>
          <Group label={figureLabel(result, leftFigure)}>
            <FigureRow count={result} figure={leftFigure} playKey={playKey} startDelay={0.45 + left * 0.1} />
          </Group>
        </div>
      )}

      {op === '/' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-bold text-stone-700">
            {leftLabel} shared into {right} equal {right === 1 ? 'group' : 'groups'}
          </p>
          <div className="flex flex-wrap items-end justify-center gap-3">
            {Array.from({ length: right }, (_, group) => (
              <PopGroup key={`${playKey}-share-${group}`} playKey={playKey} delay={group * 0.16}>
                <FigureRow
                  count={result}
                  figure={leftFigure}
                  playKey={playKey}
                  startDelay={group * 0.16}
                />
              </PopGroup>
            ))}
          </div>
          <Operator playKey={playKey} delay={0.2 + right * 0.16}>=</Operator>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + right * 0.16, type: 'spring', stiffness: 420, damping: 14 }}
            className="text-base font-bold text-stone-800"
          >
            {result} in each group
          </motion.p>
        </div>
      )}
    </figure>
  );
}
