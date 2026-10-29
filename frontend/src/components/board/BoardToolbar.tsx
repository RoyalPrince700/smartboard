import clsx from 'clsx';
import { Eraser, Pen, Trash2 } from 'lucide-react';
import { BOARD_COLORS, PEN_WIDTH_MAX, PEN_WIDTH_MIN, type ToolMode } from '../../types/tools';
import { useBoardStore } from '../../stores/boardStore';
import { useAIStore } from '../../stores/aiStore';
import { useCompactChrome, useLandscapeBoard } from '../../hooks/useLandscapeBoard';
import { IconButton } from '../common/IconButton';

function PenEraserSwitch({
  activeTool,
  labeled = false,
  onPen,
  onEraser,
}: {
  activeTool: ToolMode;
  labeled?: boolean;
  onPen: () => void;
  onEraser: () => void;
}) {
  const toolClass = (active: boolean) =>
    clsx(
      'flex touch-manipulation items-center justify-center gap-1.5 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-neutral-400',
      labeled ? 'h-12 min-w-[6.25rem] px-3' : 'h-11 w-11',
      active ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
    );

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-neutral-100 p-1" role="group" aria-label="Pencil or eraser">
      <button
        type="button"
        onClick={onPen}
        aria-pressed={activeTool === 'pen'}
        aria-label="Pencil"
        title="Pencil"
        className={toolClass(activeTool === 'pen')}
      >
        <Pen size={20} aria-hidden="true" />
        {labeled && <span className="text-sm font-semibold">Pencil</span>}
      </button>
      <button
        type="button"
        onClick={onEraser}
        aria-pressed={activeTool === 'eraser'}
        aria-label="Eraser"
        title="Eraser"
        className={toolClass(activeTool === 'eraser')}
      >
        <Eraser size={20} aria-hidden="true" />
        {labeled && <span className="text-sm font-semibold">Eraser</span>}
      </button>
    </div>
  );
}

interface BoardToolbarProps {
  onClear: () => void;
}

export function BoardToolbar({ onClear }: BoardToolbarProps) {
  const focusMode = useAIStore((s) => s.focusMode);
  const boardLessonOpen = useAIStore((s) => s.boardLessonOpen);
  const toolSettings = useBoardStore((s) => s.toolSettings);
  const setToolSettings = useBoardStore((s) => s.setToolSettings);
  const setMouseDrawingEnabled = useBoardStore((s) => s.setMouseDrawingEnabled);
  const compact = useCompactChrome();
  const { isCompactLandscape } = useLandscapeBoard();

  const selectPen = () => {
    setToolSettings({ activeTool: 'pen' });
    setMouseDrawingEnabled(true);
  };

  const selectEraser = () => {
    setToolSettings({ activeTool: 'eraser' });
    setMouseDrawingEnabled(true);
  };

  const shellClass =
    'pointer-events-auto flex items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white/95 px-2 py-2 shadow-lg backdrop-blur';

  const penEraserSwitch = (
    <PenEraserSwitch
      activeTool={toolSettings.activeTool}
      labeled={isCompactLandscape}
      onPen={selectPen}
      onEraser={selectEraser}
    />
  );

  // Mobile focus mode keeps a large pencil/eraser switch. Desktop keeps the full tool set.
  if (focusMode) {
    if (boardLessonOpen) return null;

    if (compact) {
      return (
        <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2">
          <div className={clsx(shellClass, 'p-1')}>{penEraserSwitch}</div>
        </div>
      );
    }

    return (
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-[60] -translate-x-1/2">
        <div className={shellClass}>
          {penEraserSwitch}

          <div className="mx-0.5 h-7 w-px bg-neutral-200" />

          <div className="flex min-w-[120px] items-center gap-2 px-1" title="Pen size">
            <span
              className="shrink-0 rounded-full bg-neutral-800"
              style={{
                width: toolSettings.width * 2,
                height: toolSettings.width * 2,
              }}
            />
            <input
              type="range"
              min={PEN_WIDTH_MIN}
              max={PEN_WIDTH_MAX}
              value={toolSettings.width}
              onChange={(e) => setToolSettings({ width: Number(e.target.value) })}
              className="pen-size-slider w-24 cursor-pointer touch-manipulation accent-neutral-900 max-md:w-16"
              aria-label="Pen size"
            />
          </div>

          <div className="mx-0.5 h-7 w-px bg-neutral-200" />

          {BOARD_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color === '#1a1a2e' ? 'Black' : 'Red'}
              onClick={() => setToolSettings({ color, activeTool: 'pen' })}
              className={clsx(
                'h-9 w-9 touch-manipulation rounded-full border-2 transition-transform',
                toolSettings.color === color && toolSettings.activeTool === 'pen'
                  ? 'scale-110 border-neutral-900'
                  : 'border-neutral-300'
              )}
              style={{ backgroundColor: color }}
            />
          ))}

          <div className="mx-0.5 h-7 w-px bg-neutral-200" />

          <IconButton
            icon={Trash2}
            label="Clear board"
            onClick={onClear}
            variant="danger"
            size="sm"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {isCompactLandscape && (
        <div className="pointer-events-none absolute bottom-[max(0.65rem,env(safe-area-inset-bottom))] left-[max(0.65rem,env(safe-area-inset-left))] z-30">
          <div className={clsx(shellClass, 'p-1')}>{penEraserSwitch}</div>
        </div>
      )}
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 max-w-[calc(100vw-1rem)] -translate-x-1/2 landscape-board:bottom-[max(0.65rem,env(safe-area-inset-bottom))] landscape-board:left-auto landscape-board:right-[max(0.5rem,env(safe-area-inset-right))] landscape-board:top-auto landscape-board:max-h-[calc(100%-4.5rem)] landscape-board:translate-x-0 landscape-board:translate-y-0">
      <div className={clsx(shellClass, 'max-md:overflow-x-auto landscape-board:flex-col landscape-board:overflow-y-auto landscape-board:px-1.5 landscape-board:py-2')}>
        {!isCompactLandscape && penEraserSwitch}

        {!isCompactLandscape && (
        <div className="mx-0.5 h-7 w-px bg-neutral-200 landscape-board:mx-0 landscape-board:my-0.5 landscape-board:h-px landscape-board:w-7" />
        )}

        <div className="flex min-w-[120px] items-center gap-2 px-1 max-md:min-w-0 landscape-board:min-w-0 landscape-board:flex-col landscape-board:px-0" title="Pen size">
          <span
            className="shrink-0 rounded-full bg-neutral-800"
            style={{
              width: toolSettings.width * 2,
              height: toolSettings.width * 2,
            }}
          />
          <input
            type="range"
            min={PEN_WIDTH_MIN}
            max={PEN_WIDTH_MAX}
            value={toolSettings.width}
            onChange={(e) => setToolSettings({ width: Number(e.target.value) })}
            className="pen-size-slider w-24 cursor-pointer touch-manipulation accent-neutral-900 max-md:w-16"
            aria-label="Pen size"
          />
        </div>

        <div className="mx-0.5 h-7 w-px bg-neutral-200 landscape-board:mx-0 landscape-board:my-0.5 landscape-board:h-px landscape-board:w-7" />

        {BOARD_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color === '#1a1a2e' ? 'Black' : 'Red'}
            onClick={() => setToolSettings({ color, activeTool: 'pen' })}
            className={clsx(
              'h-9 w-9 touch-manipulation rounded-full border-2 transition-transform',
              toolSettings.color === color && toolSettings.activeTool === 'pen'
                ? 'scale-110 border-neutral-900'
                : 'border-neutral-300'
            )}
            style={{ backgroundColor: color }}
          />
        ))}

        <div className="mx-0.5 h-7 w-px bg-neutral-200 landscape-board:mx-0 landscape-board:my-0.5 landscape-board:h-px landscape-board:w-7" />

        <IconButton icon={Trash2} label="Clear board" onClick={onClear} variant="danger" size="sm" />
      </div>
    </div>
    </>
  );
}
