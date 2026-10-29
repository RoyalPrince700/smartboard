import { useMemo, useState } from 'react';
import { SocialPostCard } from '../components/social/SocialPostCard';
import { SocialStyleGuidePanel } from '../components/social/SocialStyleGuidePanel';
import { SOCIAL_POSTS, getSocialTopics } from '../data/social';

export function SocialPage() {
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const topics = getSocialTopics();

  const filteredPosts = useMemo(() => {
    return SOCIAL_POSTS.filter((post) => {
      if (topicFilter && post.topic !== topicFilter) return false;
      if (statusFilter && post.status !== statusFilter) return false;
      return true;
    });
  }, [topicFilter, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: SOCIAL_POSTS.length,
      draft: SOCIAL_POSTS.filter((p) => p.status === 'draft').length,
      ready: SOCIAL_POSTS.filter((p) => p.status === 'ready').length,
      posted: SOCIAL_POSTS.filter((p) => p.status === 'posted').length,
    };
  }, []);

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <header className="mb-10">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Social Posts</h1>
        <p className="mt-1 text-[15px] text-neutral-500">
          One angle per post — six platform versions · AI explores your codebase to find what to write
        </p>
      </header>

      <SocialStyleGuidePanel />

        <section className="mb-10 rounded-3xl border border-neutral-200/80 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-500">
            Content library
          </p>
          <h2 className="max-w-xl text-[24px] font-semibold leading-[1.2] tracking-tight text-neutral-900 sm:text-[32px]">
            Posts live in your codebase.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500 sm:text-[16px]">
            Ask AI to write a post from a session update or raw thoughts. One rich post per platform — copy and publish. Attach screen recordings via media notes.
            Update your profile links in{' '}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[13px] text-neutral-700">
              data/social/socialProfiles.ts
            </code>
            . Saved posts in{' '}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[13px] text-neutral-700">
              frontend/src/data/social/posts.ts
            </code>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(['linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'whatsapp'] as const).map(
              (p) => (
                <span
                  key={p}
                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-[12px] font-medium capitalize text-neutral-600"
                >
                  {p === 'twitter' ? 'X' : p}
                </span>
              )
            )}
          </div>
        </section>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTopicFilter(null)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                topicFilter === null
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All topics
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setTopicFilter(topic)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  topicFilter === topic
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: null, label: `All (${counts.all})` },
                { key: 'ready', label: `Ready (${counts.ready})` },
                { key: 'draft', label: `Draft (${counts.draft})` },
                { key: 'posted', label: `Posted (${counts.posted})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-neutral-200 text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Post grid */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
            <p className="text-[17px] font-medium text-neutral-900">No posts match these filters</p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] text-neutral-500">
              Clear filters or add a new post in{' '}
              <code className="text-[13px]">data/social/posts.ts</code>
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filteredPosts.map((post) => (
              <li key={post.id}>
                <SocialPostCard post={post} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 border-t border-neutral-200 pt-6 text-[13px] text-neutral-400">
          {SOCIAL_POSTS.length} posts · Edit content in{' '}
          <code className="text-neutral-500">src/data/social/posts.ts</code>
        </p>
    </div>
  );
}
