import clsx from 'clsx';
import { Eraser, Pen, Trash2 } from 'lucide-react';
import { BOARD_COLORS, PEN_WIDTH_MAX, PEN_WIDTH_MIN } from '../../types/tools';
import { useBoardStore } from '../../stores/boardStore';
import { useAIStore } from '../../stores/aiStore';
import { IconButton } from '../common/IconButton';

interface BoardToolbarProps {
  onClear: () => void;
}

export function BoardToolbar({ onClear }: BoardToolbarProps) {
  const focusMode = useAIStore((s) => s.focusMode);
  const boardLessonOpen = useAIStore((s) => s.boardLessonOpen);
  const toolSettings = useBoardStore((s) => s.toolSettings);
  const setToolSettings = useBoardStore((s) => s.setToolSettings);
  const setMouseDrawingEnabled = useBoardStore((s) => s.setMouseDrawingEnabled);
  const mouseDrawingEnabled = useBoardStore((s) => s.mouseDrawingEnabled);

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

  // Mobile focus mode stays presentation-only; desktop keeps drawing tools when writing.
  if (focusMode) {
    if (boardLessonOpen) return null;

    return (
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-[60] hidden -translate-x-1/2 md:block">
        <div className={shellClass}>
          <IconButton
            icon={Pen}
            label="Activate pen (required for mouse/trackpad drawing)"
            active={toolSettings.activeTool === 'pen'}
            onClick={selectPen}
            size="sm"
            className={clsx(
              toolSettings.activeTool === 'pen' && mouseDrawingEnabled
                ? 'bg-neutral-900 text-white ring-2 ring-neutral-200'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            )}
          />
          <IconButton
            icon={Eraser}
            label="Activate eraser"
            active={toolSettings.activeTool === 'eraser'}
            onClick={selectEraser}
            size="sm"
            className={clsx(
              toolSettings.activeTool === 'eraser'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            )}
          />

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
              className="pen-size-slider w-24 cursor-pointer touch-manipulation accent-neutral-900"
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
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 landscape-board:bottom-auto landscape-board:left-auto landscape-board:right-2 landscape-board:top-1/2 landscape-board:translate-x-0 landscape-board:-translate-y-1/2 landscape-board:pr-[max(0px,env(safe-area-inset-right))]">
      <div className={clsx(shellClass, 'landscape-board:flex-col landscape-board:px-1.5 landscape-board:py-2')}>
        <IconButton
          icon={Pen}
          label="Activate pen (required for mouse/trackpad drawing)"
          active={toolSettings.activeTool === 'pen'}
          onClick={selectPen}
          size="sm"
          className={clsx(
            toolSettings.activeTool === 'pen' && mouseDrawingEnabled && 'ring-2 ring-neutral-200'
          )}
        />
        <IconButton
          icon={Eraser}
          label="Activate eraser"
          active={toolSettings.activeTool === 'eraser'}
          onClick={selectEraser}
          size="sm"
        />

        <div className="mx-0.5 h-7 w-px bg-neutral-200 landscape-board:mx-0 landscape-board:my-0.5 landscape-board:h-px landscape-board:w-7" />

        <div className="flex min-w-[120px] items-center gap-2 px-1 landscape-board:min-w-0 landscape-board:flex-col landscape-board:px-0" title="Pen size">
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
            className="pen-size-slider w-24 cursor-pointer touch-manipulation accent-neutral-900"
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
  );
}
