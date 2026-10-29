import { ReactNode } from 'react';
import { BookOpen, CheckCircle2, GitCompareArrows, Lightbulb, ListChecks } from 'lucide-react';
import { TeachingResponse, formatIntentLabel, formatSubjectLabel } from '../../types/ai';
import { SubjectBadge } from './SubjectSelector';
import { TutorAction, TutorActionBar, TutorActionId } from '../tutor/TutorActionBar';

type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function parseContent(text: string): ContentBlock[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const listItem = /^[-*•]\s+(.+)$/.exec(line);

    if (!line) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
    } else if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*.+?\*\*|\*.+?\*|`.+?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-indigo-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

interface SubjectResponseViewProps {
  response: TeachingResponse;
  actions?: TutorAction[];
  onAction?: (id: TutorActionId) => void;
  loading?: boolean;
  displayMode?: 'panel' | 'board';
}

export function SubjectResponseView({
  response,
  actions = [],
  onAction,
  loading = false,
  displayMode = 'panel',
}: SubjectResponseViewProps) {
  const subject = response.subject ?? response.classification?.subject ?? 'general';
  const intent = response.responseType ?? response.classification?.intent ?? 'explain';
  const blocks = parseContent(response.text);

  return (
    <article className={displayMode === 'board' ? 'space-y-6' : 'space-y-4'}>
      <header className={`rounded-2xl border border-indigo-100 bg-indigo-50/70 ${displayMode === 'board' ? 'p-6' : 'p-4'}`}>
        <SubjectBadge subject={String(subject)} intent={formatIntentLabel(String(intent))} />
        <h2 className={`mt-3 font-bold text-slate-900 ${displayMode === 'board' ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
          Let&apos;s explore {formatSubjectLabel(String(subject)).toLowerCase()}
        </h2>
        <p className="mt-1 text-sm text-slate-600">Here&apos;s a clear way to understand it.</p>
      </header>

      <section
        className={displayMode === 'board' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}
        aria-label="Tutor explanation"
      >
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            return (
              <h3
                key={index}
                className={`flex items-center gap-2 pt-1 text-base font-bold text-slate-800 ${
                  displayMode === 'board' ? 'md:col-span-2' : ''
                }`}
              >
                <BookOpen size={17} className="shrink-0 text-indigo-500" aria-hidden="true" />
                {renderInline(block.text)}
              </h3>
            );
          }
          if (block.type === 'list') {
            return (
              <ul
                key={index}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-indigo-500"
                      aria-hidden="true"
                    />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm"
            >
              {renderInline(block.text)}
            </div>
          );
        })}
      </section>

      {response.keyPoints && response.keyPoints.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-900">
            <Lightbulb size={17} aria-hidden="true" />
            Key points
          </h3>
          <ul className="space-y-2">
            {response.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-amber-900">
                <span aria-hidden="true">•</span> {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {response.comparison && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <GitCompareArrows size={17} className="text-indigo-500" aria-hidden="true" />
            {response.comparison.itemA} vs {response.comparison.itemB}
          </h3>
          <div className="grid gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">Similarities</p>
              <ul className="space-y-1">
                {response.comparison.similarities.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-950">• {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-sky-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-700">Differences</p>
              <ul className="space-y-1">
                {response.comparison.differences.map((d, i) => (
                  <li key={i} className="text-sm text-sky-950">• {d}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {response.quizQuestions && response.quizQuestions.length > 0 && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-violet-900">
            <ListChecks size={17} aria-hidden="true" />
            Check your understanding
          </h3>
          <ol className="space-y-3">
            {response.quizQuestions.map((q, i) => (
              <li key={i} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">
                  {i + 1}. {q.question}
                </p>
                {q.options && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {q.options.map((opt, j) => (
                      <li key={j} className="text-xs text-slate-600">{String.fromCharCode(65 + j)}. {opt}</li>
                    ))}
                  </ul>
                )}
                <details className="mt-2 text-xs text-violet-700">
                  <summary className="cursor-pointer font-semibold">Show answer</summary>
                  <p className="mt-1">{q.answer}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}

      {response.examples && response.examples.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-slate-800">Examples</h3>
          <ul className="space-y-2">
            {response.examples.map((ex, i) => (
              <li key={i} className="text-sm leading-relaxed text-slate-700">• {ex}</li>
            ))}
          </ul>
        </section>
      )}

      {response.nonExamples && response.nonExamples.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <h3 className="mb-2 text-sm font-bold text-slate-700">Compare with these</h3>
          <ul className="space-y-1">
            {response.nonExamples.map((ex, i) => (
              <li key={i} className="text-sm text-slate-600">• {ex}</li>
            ))}
          </ul>
        </section>
      )}

      {onAction && (
        <TutorActionBar actions={actions} onAction={onAction} loading={loading} />
      )}
    </article>
  );
}
