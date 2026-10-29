import { Link, useParams } from 'react-router-dom';
import { SocialPostDetail } from '../components/social/SocialPostDetail';
import { getSocialPost } from '../data/social';
import {
  formatPostDate,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../utils/social';

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50">
      {children}
    </span>
  );
}

export function SocialPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = id ? getSocialPost(id) : undefined;

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#f5f5f7] px-5 text-center">
        <h1 className="text-[21px] font-semibold text-neutral-900">Post not found</h1>
        <p className="mt-2 text-[15px] text-neutral-500">
          Check the id in <code className="text-[13px]">data/social/posts.ts</code>
        </p>
        <Link to="/admin/social" className="mt-6">
          <SecondaryButton>← Back to posts</SecondaryButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <nav className="mb-8">
        <Link
          to="/admin/social"
          className="text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← All posts
        </Link>
      </nav>

        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
              {post.topic}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLES[post.status]}`}
            >
              {STATUS_LABELS[post.status]}
            </span>
            <span className="text-[12px] text-neutral-400">{formatPostDate(post.createdAt)}</span>
          </div>

          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-[34px]">
            {post.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-500">
            {post.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white px-2 py-0.5 text-[12px] font-medium text-neutral-500 ring-1 ring-neutral-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {post.sourceWriteUp && (
          <details className="mb-8 rounded-2xl border border-neutral-200 bg-[#f5f5f7] px-5 py-4">
            <summary className="cursor-pointer text-[13px] font-semibold text-neutral-600">
              Original raw write-up
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-600">
              {post.sourceWriteUp}
            </p>
          </details>
        )}

        <SocialPostDetail post={post} />
    </div>
  );
}
