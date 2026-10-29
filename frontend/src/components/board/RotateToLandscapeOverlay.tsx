import { useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { lockLandscape, useLandscapeBoard } from '../../hooks/useLandscapeBoard';

export function RotateToLandscapeOverlay() {
  const { needsRotate } = useLandscapeBoard();

  useEffect(() => {
    void lockLandscape();
    return () => {
      try {
        screen.orientation?.unlock();
      } catch {
        // Ignore if the browser never granted a lock.
      }
    };
  }, []);

  const handleContinue = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // iOS Safari does not support fullscreen on documentElement.
    }
    await lockLandscape();
  };

  return (
    <div
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-center gap-5 bg-[#f5f5f7] px-8 text-center text-neutral-900 portrait-phone:flex"
      role="dialog"
      aria-modal={needsRotate}
      aria-hidden={!needsRotate}
      aria-labelledby="rotate-board-title"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: needsRotate ? 'flex' : 'none',
      }}
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Smartphone size={64} strokeWidth={1.5} className="board-phone-tilt text-neutral-800" />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 id="rotate-board-title" className="text-2xl font-semibold tracking-tight">
          Turn your phone sideways
        </h2>
        <p className="text-base leading-relaxed text-neutral-500">
          The board is built for landscape so you have room to write.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleContinue()}
        className="mt-2 min-h-[48px] rounded-full bg-neutral-900 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
      >
        I rotated — continue
      </button>
    </div>
  );
}
