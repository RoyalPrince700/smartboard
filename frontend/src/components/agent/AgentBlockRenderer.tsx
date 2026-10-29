import clsx from 'clsx';
import type { ReactNode } from 'react';
import { MathExpression } from '../math/MathExpression';
import { DiagramPreview } from '../math/DiagramPreview';
import { AgentResponseBlock } from '../../types/agent';
import type { DiagramSpec } from '../../types/geometry';

interface AgentBlockRendererProps {
  block: AgentResponseBlock;
  displayMode?: 'panel' | 'board';
}

function BlockShell({
  title,
  children,
  variant = 'default',
  displayMode = 'panel',
}: {
  title?: string;
  children: ReactNode;
  variant?: 'default' | 'hint' | 'success' | 'error' | 'callout';
  displayMode?: 'panel' | 'board';
}) {
  const styles = {
    default: 'border-slate-200 bg-white',
    hint: 'border-amber-200 bg-amber-50',
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-rose-200 bg-rose-50',
    callout: 'border-indigo-200 bg-indigo-50',
  };

  return (
    <article
      className={clsx(
        'rounded-2xl border p-4 shadow-sm',
        styles[variant],
        displayMode === 'board' && 'p-5 sm:p-6'
      )}
    >
      {title && <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>}
      <div className="text-sm leading-relaxed text-slate-800 sm:text-base">{children}</div>
    </article>
  );
}

export function AgentBlockRenderer({ block, displayMode = 'panel' }: AgentBlockRendererProps) {
  switch (block.type) {
    case 'formula':
    case 'calculation':
      return (
        <BlockShell title={block.title ?? block.label} displayMode={displayMode}>
          <MathExpression text={block.expression ?? ''} latex={block.latex} block />
        </BlockShell>
      );

    case 'question':
      return (
        <BlockShell title={block.title ?? 'Question'} variant="callout" displayMode={displayMode}>
          <p className="font-semibold text-indigo-900">{block.prompt}</p>
        </BlockShell>
      );

    case 'hint':
      return (
        <BlockShell title={block.title ?? 'Hint'} variant="hint" displayMode={displayMode}>
          <p>{block.content}</p>
        </BlockShell>
      );

    case 'answer':
      return (
        <BlockShell title={block.title ?? 'Answer'} variant="success" displayMode={displayMode}>
          <MathExpression text={block.value ?? ''} latex={block.latex} block />
        </BlockShell>
      );

    case 'verification': {
      const variant =
        block.status === 'correct' ? 'success' : block.status === 'incorrect' ? 'error' : 'default';
      return (
        <BlockShell title={block.title ?? 'Answer check'} variant={variant} displayMode={displayMode}>
          {block.feedback && <p className="font-semibold">{block.feedback}</p>}
          {block.expected && (
            <p className="mt-2 text-sm text-slate-600">
              Expected: <MathExpression text={block.expected} />
            </p>
          )}
          {block.received && (
            <p className="mt-1 text-sm text-slate-600">
              Your answer: <MathExpression text={block.received} />
            </p>
          )}
        </BlockShell>
      );
    }

    case 'example':
      return (
        <BlockShell title={block.title ?? 'Example'} displayMode={displayMode}>
          <MathExpression text={block.question ?? block.content ?? ''} block />
        </BlockShell>
      );

    case 'callout':
      return (
        <BlockShell
          title={block.title ?? (block.variant === 'misconception' ? 'Common mistake' : 'Note')}
          variant="callout"
          displayMode={displayMode}
        >
          <p>{block.content}</p>
        </BlockShell>
      );

    case 'diagram': {
      const spec = block.spec as DiagramSpec | undefined;
      if (!spec?.elements) {
        return (
          <BlockShell title={block.title ?? 'Diagram'} displayMode={displayMode}>
            <p>The diagram could not be drawn.</p>
          </BlockShell>
        );
      }
      return (
        <BlockShell title={block.title ?? 'Diagram'} displayMode={displayMode}>
          <DiagramPreview diagram={spec} hideTitle />
        </BlockShell>
      );
    }

    default:
      return (
        <BlockShell title={block.title} displayMode={displayMode}>
          {block.content ? <p>{block.content}</p> : null}
        </BlockShell>
      );
  }
}

interface AgentResponseViewProps {
  blocks: AgentResponseBlock[];
  displayMode?: 'panel' | 'board';
}

export function AgentResponseView({ blocks, displayMode = 'panel' }: AgentResponseViewProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <AgentBlockRenderer key={`${block.type}-${index}`} block={block} displayMode={displayMode} />
      ))}
    </div>
  );
}

function blocksToSpeechText(blocks: AgentResponseBlock[]): string {
  return blocks
    .map((block) => {
      if (block.content) return block.content;
      if (block.prompt) return block.prompt;
      if (block.value) return block.value;
      if (block.expression) return block.expression;
      if (block.feedback) return block.feedback;
      if (block.question) return block.question;
      return block.title ?? '';
    })
    .filter(Boolean)
    .join('. ');
}

export { blocksToSpeechText };
