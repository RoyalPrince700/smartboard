import { useEffect, useState } from 'react';

/** Keep in sync with `portrait-phone` in tailwind.config.js */
export const PORTRAIT_PHONE_QUERY = '(orientation: portrait) and (max-width: 540px)';
/** Keep in sync with `landscape-board` in tailwind.config.js */
export const LANDSCAPE_BOARD_QUERY = '(orientation: landscape) and (max-height: 540px)';

function matches(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

type OrientationLock = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary') => Promise<void>;
};

export async function lockLandscape(): Promise<void> {
  try {
    const orientation = screen.orientation as OrientationLock | undefined;
    if (typeof orientation?.lock === 'function') {
      await orientation.lock('landscape');
    }
  } catch {
    // Browsers often allow this only in fullscreen or an installed web app.
  }
}

/** Phone landscape, or any viewport narrower than the desktop lesson layout. */
export const COMPACT_CHROME_QUERY =
  '(max-width: 1023px), (orientation: landscape) and (max-height: 540px)';

export function useCompactChrome(): boolean {
  const [compact, setCompact] = useState(() => matches(COMPACT_CHROME_QUERY));

  useEffect(() => {
    const media = window.matchMedia(COMPACT_CHROME_QUERY);

    const sync = () => setCompact(media.matches);

    media.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    sync();

    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  return compact;
}

export function useLandscapeBoard() {
  const [needsRotate, setNeedsRotate] = useState(() => matches(PORTRAIT_PHONE_QUERY));
  const [isCompactLandscape, setIsCompactLandscape] = useState(() =>
    matches(LANDSCAPE_BOARD_QUERY)
  );

  useEffect(() => {
    const portrait = window.matchMedia(PORTRAIT_PHONE_QUERY);
    const landscape = window.matchMedia(LANDSCAPE_BOARD_QUERY);

    const sync = () => {
      setNeedsRotate(portrait.matches);
      setIsCompactLandscape(landscape.matches);
    };

    portrait.addEventListener('change', sync);
    landscape.addEventListener('change', sync);
    window.addEventListener('orientationchange', sync);
    window.addEventListener('resize', sync);
    sync();

    return () => {
      portrait.removeEventListener('change', sync);
      landscape.removeEventListener('change', sync);
      window.removeEventListener('orientationchange', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return { needsRotate, isCompactLandscape };
}
