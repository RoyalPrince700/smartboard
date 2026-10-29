import type { SocialPlatform } from '../../types/social';

/**
 * Your profile / compose URLs — update these to your real accounts.
 * "Open" buttons on each platform panel use these links.
 */
export const SOCIAL_PROFILE_URLS: Record<SocialPlatform, string> = {
  linkedin: 'https://www.linkedin.com/feed/',
  twitter: 'https://x.com/compose/post',
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/upload',
  whatsapp: 'https://web.whatsapp.com/',
};

export const SOCIAL_OPEN_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'Open LinkedIn',
  twitter: 'Compose on X',
  facebook: 'Open Facebook',
  instagram: 'Open Instagram',
  tiktok: 'Upload on TikTok',
  whatsapp: 'Open WhatsApp',
};
