import { Link } from 'react-router-dom';
import type { SocialPost } from '../../types/social';
import { formatPostDate, STATUS_LABELS, STATUS_STYLES } from '../../utils/social';

interface SocialPostCardProps {
  post: SocialPost;
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  return (
    <Link
      to={`/admin/social/${post.id}`}
      className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
          {post.topic}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLES[post.status]}`}
        >
          {STATUS_LABELS[post.status]}
        </span>
      </div>

      <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-700">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-neutral-500">
        {post.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#f5f5f7] px-1.5 py-0.5 text-[11px] font-medium text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[12px] text-neutral-400">{formatPostDate(post.createdAt)}</span>
      </div>

      <p className="mt-3 text-[13px] font-medium text-neutral-400 transition-colors group-hover:text-neutral-600">
        View all 6 platforms →
      </p>
    </Link>
  );
}
