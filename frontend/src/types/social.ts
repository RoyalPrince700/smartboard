export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp';

export type SocialPostStatus = 'draft' | 'ready' | 'posted';

export type SocialMediaType = 'screen-recording' | 'video' | 'image' | 'carousel';

export interface SocialMediaAttachment {
  type: SocialMediaType;
  description: string;
  /** Shots/scenes to capture in the recording */
  shots?: string[];
}

export interface PlatformPost {
  /** Single-post copy. LinkedIn/WhatsApp series and Twitter threads can omit this. */
  content?: string;
  /** Optional short opener — useful for TikTok / Reels */
  hook?: string;
  /** Platform-specific hashtags (without #) */
  hashtags?: string[];
  /**
   * Twitter/X — up to 2 complete tweets per day (post separately, not a cliffhanger thread).
   */
  thread?: string[];
  /**
   * Two complete daily posts (e.g. morning + evening) — NOT fragments of one story.
   * LinkedIn and WhatsApp use this. Each item must read finished on its own.
   */
  series?: string[];
  /** Video, screen recording, or image to attach when publishing */
  media?: SocialMediaAttachment[];
  /** Extra notes for you when posting (not copied) */
  notes?: string;
}

export interface SocialPost {
  id: string;
  title: string;
  /** Grouping label, e.g. "Build log", "Tech stack" */
  topic: string;
  summary: string;
  tags: string[];
  createdAt: string;
  status: SocialPostStatus;
  /** Original unedited write-up this post was adapted from */
  sourceWriteUp?: string;
  platforms: Record<SocialPlatform, PlatformPost>;
}

export interface PlatformMeta {
  id: SocialPlatform;
  label: string;
  shortLabel: string;
  /** Soft character limit per single post/tweet/status slide */
  charLimit: number;
  /** Rich content target (caption, thread total, series part, etc.) */
  richTargetChars: number;
  color: string;
  bgColor: string;
  description: string;
  supportsThread: boolean;
  supportsSeries: boolean;
}
