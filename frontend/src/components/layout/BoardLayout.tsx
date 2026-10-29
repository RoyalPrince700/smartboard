import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useAIStore } from '../../stores/aiStore';
import { RotateToLandscapeOverlay } from '../board/RotateToLandscapeOverlay';

interface BoardLayoutProps {
  title: string;
  onTitleChange?: (title: string) => void;
  children: ReactNode;
  toolbar: ReactNode;
}

export function BoardLayout({
  title,
  onTitleChange,
  children,
  toolbar,
}: BoardLayoutProps) {
  const focusMode = useAIStore((state) => state.focusMode);

  return (
    <div className="fixed inset-0 h-dvh w-dvw flex overflow-hidden bg-[#f5f5f7]">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!focusMode && (
        <header className="relative z-30 flex w-full items-center gap-3 px-3 py-2.5 bg-white/90 backdrop-blur-sm shrink-0 border-b border-neutral-200/80 landscape-board:absolute landscape-board:left-0 landscape-board:right-0 landscape-board:top-0 landscape-board:z-30 landscape-board:w-full landscape-board:border-0 landscape-board:bg-transparent landscape-board:p-1.5 landscape-board:pt-[max(0.35rem,env(safe-area-inset-top))] landscape-board:pl-[max(0.35rem,env(safe-area-inset-left))] landscape-board:pr-[max(0.35rem,env(safe-area-inset-right))]">
          <Link
            to="/boards"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 touch-manipulation landscape-board:h-10 landscape-board:w-10 landscape-board:bg-white/90 landscape-board:text-neutral-700 landscape-board:shadow-sm landscape-board:backdrop-blur-sm"
            title="Back to boards"
          >
            <ArrowLeft size={18} />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="min-w-0 flex-1 border-b border-transparent bg-transparent text-base font-medium text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-300 landscape-board:hidden"
          />
        </header>
        )}

        <main className={clsx('relative flex-1 min-h-0', focusMode ? 'bg-white' : 'bg-[#f5f5f7]')}>
          {children}
          {toolbar}
        </main>
      </div>
      <RotateToLandscapeOverlay />
    </div>
  );
}
