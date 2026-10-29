import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SplitWhiteboard } from '../components/whiteboard/SplitWhiteboard';
import { RotateToLandscapeOverlay } from '../components/board/RotateToLandscapeOverlay';

export function SplitWhiteboardPage() {
  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden bg-slate-200">
      <header className="flex shrink-0 items-center justify-between bg-slate-900 px-4 py-3 text-white landscape-board:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            ← Back to home
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Split Whiteboard</h1>
            <p className="text-xs text-white/60">
              Draw on the left — recognized mathematical geometry appears on the right
            </p>
          </div>
        </div>
      </header>

      <Link
        to="/"
        className="absolute left-[max(0.5rem,env(safe-area-inset-left))] top-[max(0.5rem,env(safe-area-inset-top))] z-30 hidden h-10 w-10 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm landscape-board:flex"
        title="Back to home"
      >
        <ArrowLeft size={18} />
      </Link>

      <SplitWhiteboard />
      <RotateToLandscapeOverlay />
    </div>
  );
}
