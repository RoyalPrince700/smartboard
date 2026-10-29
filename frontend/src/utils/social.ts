import type { PlatformPost, SocialPlatform } from '../types/social';
import { PLATFORM_MAP } from '../data/social';

function formatHashtags(hashtags?: string[]): string {
  if (!hashtags?.length) return '';
  return hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
}

/** Main copy block — hook + content + hashtags */
export function buildCopyText(_platform: SocialPlatform, post: PlatformPost): string {
  const parts: string[] = [];

  if (post.hook?.trim()) {
    parts.push(post.hook.trim());
  }

  if (post.content?.trim()) {
    parts.push(post.content.trim());
  }

  const tags = formatHashtags(post.hashtags);
  if (tags) parts.push(tags);

  return parts.join('\n\n');
}

/** Full thread as numbered blocks for paste */
export function buildThreadCopyText(post: PlatformPost): string {
  if (!post.thread?.length) return buildCopyText('twitter', post);
  return post.thread.map((tweet, i) => `${i + 1}/${post.thread!.length}\n${tweet}`).join('\n\n---\n\n');
}

/** Single series part with optional hashtags */
export function buildSeriesPartText(post: PlatformPost, index: number): string {
  const part = post.series?.[index];
  if (!part) return '';
  const tags = formatHashtags(post.hashtags);
  return tags ? `${part}\n\n${tags}` : part;
}

/** All series parts numbered */
export function buildSeriesCopyText(post: PlatformPost): string {
  if (!post.series?.length) return buildCopyText('linkedin', post);
  return post.series
    .map((part, i) => `Part ${i + 1}/${post.series!.length}\n${part}`)
    .join('\n\n---\n\n');
}

export function getCharacterCount(text: string): number {
  return text.length;
}

export function getLimitStatus(
  platform: SocialPlatform,
  charCount: number
): 'ok' | 'warn' | 'over' {
  const limit = PLATFORM_MAP[platform].charLimit;
  if (charCount <= limit) return 'ok';
  if (charCount <= limit * 1.15) return 'warn';
  return 'over';
}

/** For threads — flag any tweet over 280 */
export function getThreadLimitStatus(thread: string[]): 'ok' | 'warn' | 'over' {
  const over = thread.some((t) => t.length > 280);
  const warn = thread.some((t) => t.length > 250);
  if (over) return 'over';
  if (warn) return 'warn';
  return 'ok';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const STATUS_LABELS = {
  draft: 'Draft',
  ready: 'Ready',
  posted: 'Posted',
} as const;

export const STATUS_STYLES = {
  draft: 'bg-amber-100 text-amber-800',
  ready: 'bg-emerald-100 text-emerald-800',
  posted: 'bg-neutral-200 text-neutral-600',
} as const;

export const MEDIA_TYPE_LABELS = {
  'screen-recording': 'Screen recording',
  video: 'Video',
  image: 'Image',
  carousel: 'Carousel',
} as const;
