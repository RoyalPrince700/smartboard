import clsx from 'clsx';
import katex from 'katex';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { FractionText } from './FractionText';
import { convertExponentsToLatex, isEquationLine, tokenizeEquation, wrapLeadingProseToLatex } from '../../utils/mathPresentation';

interface MathExpressionProps {
  text: string;
  latex?: string;
  block?: boolean;
  className?: string;
  activeTokenIndex?: number;
}

function toLatex(text: string): string {
  return wrapLeadingProseToLatex(
    convertExponentsToLatex(
      text
        .replace(/\[FRAC:([^:\]]+):([^\]]+)\]/g, '\\frac{$1}{$2}')
        .replace(/→/g, '\\rightarrow')
        .replace(/÷/g, '\\div')
        .replace(/×/g, '\\times')
        .replace(/\*/g, '\\times ')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/₁/g, '_1')
        .replace(/₂/g, '_2')
        .replace(/Δ/g, '\\Delta')
        .trim()
    )
  );
}

export function MathExpression({
  text,
  latex,
  block = false,
  className,
  activeTokenIndex,
}: MathExpressionProps) {
  if (!latex && !isEquationLine(text)) {
    return (
      <span
        className={clsx('whitespace-pre-line', block && 'block', className)}
        aria-label={text}
      >
        <FractionText text={text} />
      </span>
    );
  }

  const expression = toLatex(latex || text);

  if (/\[FRAC:/.test(text)) {
    return (
      <span
        className={clsx(
          'inline-flex flex-wrap items-center justify-center gap-x-1',
          block && 'block overflow-x-auto overflow-y-hidden py-1',
          className
        )}
        aria-label={text}
      >
        <FractionText text={text} />
      </span>
    );
  }

  if (activeTokenIndex !== undefined) {
    const tokens = tokenizeEquation(text);
    return (
      <span
        className={clsx(
          'flex flex-wrap items-center justify-center gap-x-2 gap-y-1',
          block && 'overflow-x-auto overflow-y-hidden py-1',
          className
        )}
        aria-label={text}
      >
        {tokens.map((token, index) => {
          let html: string | undefined;
          try {
            html = katex.renderToString(toLatex(token), {
              displayMode: false,
              throwOnError: true,
              strict: false,
              trust: false,
              output: 'html',
            });
          } catch {
            html = undefined;
          }

          const active = index === activeTokenIndex;
          return (
            <motion.span
              key={`${token}-${index}`}
              animate={
                active
                  ? {
                      scale: [1, 1.16, 1.08],
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.18)',
                    }
                  : {
                      scale: 1,
                      backgroundColor: 'rgba(255,255,255,0)',
                      color: '#0f172a',
                      boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)',
                    }
              }
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="inline-flex min-h-[1.5em] items-center rounded-lg px-1.5"
              dangerouslySetInnerHTML={html ? { __html: html } : undefined}
            >
              {!html ? token : undefined}
            </motion.span>
          );
        })}
      </span>
    );
  }

  try {
    const html = katex.renderToString(expression, {
      displayMode: block,
      throwOnError: true,
      strict: false,
      trust: false,
      output: 'html',
    });

    return (
      <span
        className={clsx(block && 'block overflow-x-auto overflow-y-hidden py-1', className)}
        aria-label={text}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <span className={clsx(block && 'block', className)}>
        <FractionText text={text} />
      </span>
    );
  }
}
