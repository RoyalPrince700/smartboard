import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { PLATFORM_MAP } from '../../data/social';
import { SOCIAL_OPEN_LABELS, SOCIAL_PROFILE_URLS } from '../../data/social/socialProfiles';
import type { PlatformPost, SocialPlatform } from '../../types/social';
import {
  MEDIA_TYPE_LABELS,
  buildCopyText,
  buildSeriesPartText,
  buildThreadCopyText,
  copyToClipboard,
  getCharacterCount,
  getLimitStatus,
  getThreadLimitStatus,
} from '../../utils/social';

interface PlatformPostPanelProps {
  platform: SocialPlatform;
  post: PlatformPost;
}

export function PlatformPostPanel({ platform, post }: PlatformPostPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const meta = PLATFORM_MAP[platform];
  const copyText = buildCopyText(platform, post);
  const charCount = getCharacterCount(copyText);
  const limitStatus = getLimitStatus(platform, charCount);
  const threadStatus = post.thread?.length ? getThreadLimitStatus(post.thread) : null;

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  const limitColor =
    limitStatus === 'over'
      ? 'text-red-600'
      : limitStatus === 'warn'
        ? 'text-amber-600'
        : 'text-neutral-400';

  const CopyBtn = ({ text, label, id }: { text: string; label: string; id: string }) => (
    <button
      type="button"
      onClick={() => handleCopy(text, id)}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      {copied === id ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4"
        style={{ backgroundColor: meta.bgColor }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.shortLabel}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">{meta.label}</h3>
            <p className="text-[12px] text-neutral-500">{meta.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[13px] font-medium tabular-nums ${limitColor}`}>
            {charCount} / {meta.richTargetChars}+ chars
          </span>
          <a
            href={SOCIAL_PROFILE_URLS[platform]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: meta.color }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {SOCIAL_OPEN_LABELS[platform]}
          </a>
          <CopyBtn text={copyText} label="Copy main" id="main" />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {post.media && post.media.length > 0 && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
              Attach media when posting
            </p>
            <ul className="space-y-2">
              {post.media.map((m, i) => (
                <li key={i} className="text-[13px] text-violet-900">
                  <span className="font-semibold">{MEDIA_TYPE_LABELS[m.type]}:</span> {m.description}
                  {m.shots && m.shots.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-[12px] text-violet-700">
                      {m.shots.map((shot) => (
                        <li key={shot}>{shot}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {post.hook && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Hook
            </p>
            <p className="text-[15px] font-medium leading-relaxed text-neutral-900">{post.hook}</p>
          </div>
        )}

        {post.content && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Main content
              </p>
              <CopyBtn text={copyText} label="Copy" id="content" />
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">
              {post.content}
            </p>
          </div>
        )}

        {post.series && post.series.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">
                2 posts today — each complete on its own
              </p>
              <CopyBtn text={post.series.join('\n\n---\n\n')} label="Copy both" id="series-all" />
            </div>
            <p className="mb-3 text-[12px] text-blue-700">
              Post one in the morning, one later. No cliffhangers — each reads finished.
            </p>
            <ol className="space-y-3">
              {post.series.map((part, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-blue-100 bg-white px-3.5 py-3"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-blue-900">
                      Post {i + 1}
                    </span>
                    <CopyBtn
                      text={buildSeriesPartText(post, i)}
                      label={`Copy post ${i + 1}`}
                      id={`series-${i}`}
                    />
                  </div>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-800">
                    {part}
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums text-neutral-400">
                    {part.length} chars
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {post.thread && post.thread.length > 0 && (
          <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
                2 tweets today — post separately, not as a thread
                {threadStatus === 'over' && (
                  <span className="ml-2 text-red-600">(over 280 chars)</span>
                )}
              </p>
              <CopyBtn text={buildThreadCopyText(post)} label="Copy both" id="thread-all" />
            </div>
            <ol className="space-y-3">
              {post.thread.map((tweet, i) => {
                const over = tweet.length > 280;
                return (
                  <li
                    key={i}
                    className="rounded-lg border border-neutral-200 bg-white px-3.5 py-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className={`text-[12px] font-bold ${over ? 'text-red-600' : 'text-neutral-700'}`}>
                        Tweet {i + 1}
                        <span className="ml-2 font-normal tabular-nums text-neutral-400">
                          {tweet.length}/280
                        </span>
                      </span>
                      <CopyBtn text={tweet} label={`Copy tweet ${i + 1}`} id={`thread-${i}`} />
                    </div>
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-800">
                      {tweet}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}

        {post.notes && (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-[#f5f5f7] px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Your notes (not copied)
            </p>
            <p className="text-[13px] leading-relaxed text-neutral-600">{post.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
