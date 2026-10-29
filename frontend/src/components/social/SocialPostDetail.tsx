import { useState } from 'react';
import { SOCIAL_PLATFORMS } from '../../data/social';
import type { SocialPlatform, SocialPost } from '../../types/social';
import { PLATFORM_MAP } from '../../data/social';
import { PlatformPostPanel } from './PlatformPostPanel';

interface SocialPostDetailProps {
  post: SocialPost;
}

export function SocialPostDetail({ post }: SocialPostDetailProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('linkedin');

  return (
    <div>
      {/* Platform tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const active = activePlatform === platform.id;
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => setActivePlatform(platform.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all ${
                active
                  ? 'text-white shadow-sm'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
              style={active ? { backgroundColor: platform.color } : undefined}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'text-white'
                }`}
                style={!active ? { backgroundColor: platform.color } : undefined}
              >
                {platform.shortLabel}
              </span>
              {platform.label}
            </button>
          );
        })}
      </div>

      {/* Active platform panel */}
      <PlatformPostPanel platform={activePlatform} post={post.platforms[activePlatform]} />

      {/* Quick overview grid */}
      <div className="mt-8">
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
          All platforms at a glance
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => setActivePlatform(platform.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                activePlatform === platform.id
                  ? 'border-neutral-400 bg-neutral-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.shortLabel}
                </span>
                <span className="text-[13px] font-medium text-neutral-700">{platform.label}</span>
              </div>
              <p className="line-clamp-2 text-[12px] leading-relaxed text-neutral-500">
                {post.platforms[platform.id].hook
                  ?? post.platforms[platform.id].content
                  ?? post.platforms[platform.id].series?.[0]
                  ?? post.platforms[platform.id].thread?.[0]}
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                {post.platforms[platform.id].series?.length
                  ? `2 daily posts`
                  : post.platforms[platform.id].thread?.length
                    ? `2 tweets`
                    : `~${PLATFORM_MAP[platform.id].richTargetChars} chars`}
                {post.platforms[platform.id].media?.length
                  ? ` · ${post.platforms[platform.id].media!.length} media`
                  : ''}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
