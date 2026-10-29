import { useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { CONTENT_ANGLES, CONTENT_GOALS, PRIMARY_OBJECTIVES } from '../../data/social/contentPlaybook';
import {
  RAW_VOICE_SAMPLES,
  SOCIAL_GENERATION_INSTRUCTIONS,
  SOCIAL_VOICE_RULES,
  STYLE_GUIDE_PATH,
} from '../../data/social/styleGuide';
import { copyToClipboard } from '../../utils/social';

export function SocialStyleGuidePanel() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<'prompt' | 'samples' | null>(null);

  const handleCopy = async (text: string, key: 'prompt' | 'samples') => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <section className="mb-10 rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-8"
      >
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-500">
            Voice + content strategy
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-neutral-900 sm:text-[20px]">
            How posts get written
          </h2>
          <p className="mt-1 text-[14px] text-neutral-500">
            Your raw thoughts = how you talk · 2 finished posts per day · Codebase = what to write about
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-6 border-t border-neutral-100 px-6 pb-8 pt-6 sm:px-8">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[14px] leading-relaxed text-blue-900">
            <strong>Raw voice samples are not length limits.</strong> They show your tone. Posts also
            serve your objectives: global hiring/clients, readable by non-technical readers,
            transparent about building with AI, and deep enough for technical collaboration.
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
              Primary objectives
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PRIMARY_OBJECTIVES.map((obj) => (
                <li
                  key={obj.id}
                  className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-3.5 py-2.5"
                >
                  <span className="text-[13px] font-semibold text-neutral-800">{obj.label}</span>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                    {obj.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
              Content angles (one per post)
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CONTENT_ANGLES.map((angle) => (
                <li
                  key={angle.id}
                  className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-3.5 py-2.5"
                >
                  <span className="text-[13px] font-semibold text-neutral-800">{angle.label}</span>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                    {angle.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
              Your voice (tone reference only)
            </h3>
            <div className="space-y-3">
              {RAW_VOICE_SAMPLES.map((sample, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-4 py-3 text-[14px] leading-relaxed text-neutral-700"
                >
                  {sample}
                </blockquote>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(RAW_VOICE_SAMPLES.join('\n\n---\n\n'), 'samples')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {copied === 'samples' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied samples
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy voice samples
                </>
              )}
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-emerald-700">
                Always
              </h3>
              <ul className="space-y-1.5 text-[14px] leading-relaxed text-neutral-600">
                {SOCIAL_VOICE_RULES.always.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="text-emerald-500">+</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-red-600">
                Avoid
              </h3>
              <ul className="space-y-1.5 text-[14px] leading-relaxed text-neutral-600">
                {SOCIAL_VOICE_RULES.avoid.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="text-red-400">−</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
                  Generation prompt
                </h3>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  Copy → add angle + optional raw thoughts + session context → ask AI to explore repo
                  and write
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(SOCIAL_GENERATION_INSTRUCTIONS, 'prompt')}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-neutral-800"
              >
                {copied === 'prompt' ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied prompt
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy prompt
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-[12px] leading-relaxed text-neutral-600 whitespace-pre-wrap">
              {SOCIAL_GENERATION_INSTRUCTIONS}
            </pre>
            <p className="mt-2 text-[12px] text-neutral-400">
              {STYLE_GUIDE_PATH} · contentPlaybook.ts · .cursor/rules/social-posts.mdc
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
