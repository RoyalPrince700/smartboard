import { useBoardStore } from '../../stores/boardStore';

export function PointerIndicator() {
  const pointerState = useBoardStore((s) => s.pointerState);
  const toolSettings = useBoardStore((s) => s.toolSettings);

  if (!pointerState.visible) return null;

  const size = Math.max(16, toolSettings.width * 6);
  const isEraser = toolSettings.activeTool === 'eraser';

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: pointerState.x,
        top: pointerState.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          border: `2px solid ${isEraser ? '#888' : toolSettings.color}`,
          backgroundColor: pointerState.active
            ? isEraser
              ? 'rgba(0,0,0,0.08)'
              : `${toolSettings.color}22`
            : 'rgba(255,255,255,0.6)',
          boxShadow: pointerState.active
            ? `0 0 0 4px ${isEraser ? 'rgba(0,0,0,0.06)' : `${toolSettings.color}18`}`
            : '0 1px 4px rgba(0,0,0,0.12)',
          borderRadius: isEraser ? '6px' : '50%',
        }}
      />
      {!pointerState.active && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-board-accent/80"
          style={{ width: 6, height: 6 }}
        />
      )}
    </div>
  );
}
