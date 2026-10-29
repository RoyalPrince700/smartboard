import { RefObject, useCallback, useEffect, useRef } from 'react';
import {
  findStrokesAtPoint,
  estimateTextBounds,
} from '../engine/stroke/EraserEngine';
import {
  appendPoint,
  createPoint,
  finishStroke,
  startStroke,
  updateShapeBounds,
} from '../engine/stroke/StrokeEngine';
import {
  getCanvasPoint,
  renderAllStrokes,
} from '../engine/stroke/StrokeRenderer';
import { useBoardStore } from '../stores/boardStore';
import { Point } from '../types/stroke';

function isTouchLikePointer(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen';
}

export function usePointerDrawing(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const strokes = useBoardStore((s) => s.strokes);
  const canvasSettings = useBoardStore((s) => s.canvasSettings);
  const toolSettings = useBoardStore((s) => s.toolSettings);
  const addStroke = useBoardStore((s) => s.addStroke);
  const updateStroke = useBoardStore((s) => s.updateStroke);
  const removeStrokesByIds = useBoardStore((s) => s.removeStrokesByIds);
  const setActiveStrokeId = useBoardStore((s) => s.setActiveStrokeId);
  const pushHistory = useBoardStore((s) => s.pushHistory);

  const setPointerState = useBoardStore((s) => s.setPointerState);

  const drawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const erasedThisStrokeRef = useRef(new Set<string>());

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width <= 0 || height <= 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    renderAllStrokes(ctx, strokes, { ...canvasSettings, width, height });
  }, [canvasRef, strokes, canvasSettings]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      const state = useBoardStore.getState();
      if (
        state.canvasSettings.width !== width ||
        state.canvasSettings.height !== height
      ) {
        state.setCanvasSettings({ width, height });
      }

      const { strokes: currentStrokes, canvasSettings: settings } = useBoardStore.getState();
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        renderAllStrokes(ctx, currentStrokes, { ...settings, width, height });
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const onOrientationChange = () => {
      resize();
      window.setTimeout(resize, 250);
    };

    window.addEventListener('orientationchange', onOrientationChange);
    window.visualViewport?.addEventListener('resize', resize);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', onOrientationChange);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [canvasRef, containerRef]);

  const getPointFromEvent = useCallback(
    (e: PointerEvent): Point => {
      const canvas = canvasRef.current!;
      const base = getCanvasPoint(canvas, e.clientX, e.clientY, e);
      return createPoint(base.x, base.y, e.pressure > 0 ? e.pressure : 0.5);
    },
    [canvasRef]
  );

  const syncPointer = useCallback(
    (e: PointerEvent, active: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const touchLike = isTouchLikePointer(e.pointerType);
      const mouseDrawingEnabled = useBoardStore.getState().mouseDrawingEnabled;

      if (!touchLike && !mouseDrawingEnabled) {
        setPointerState({ visible: false, active: false });
        return;
      }

      const base = getCanvasPoint(canvas, e.clientX, e.clientY, e);
      setPointerState({ x: base.x, y: base.y, visible: true, active });
    },
    [canvasRef, setPointerState]
  );

  const endDrawing = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;

      if (e.pointerType === 'mouse' || isTouchLikePointer(e.pointerType)) {
        syncPointer(e, false);
      }

      if (!drawingRef.current) return;

      if (canvas?.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      drawingRef.current = false;
      activePointerIdRef.current = null;

      const strokeId = useBoardStore.getState().activeStrokeId;
      if (strokeId) {
        updateStroke(strokeId, (s) => finishStroke(s));
        setActiveStrokeId(null);
      }
    },
    [canvasRef, syncPointer, updateStroke, setActiveStrokeId]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || e.button !== 0) return;

      const touchLike = isTouchLikePointer(e.pointerType);

      if (touchLike) {
        useBoardStore.getState().setMouseDrawingEnabled(false);
      } else if (e.pointerType === 'mouse' && !useBoardStore.getState().mouseDrawingEnabled) {
        return;
      }

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      activePointerIdRef.current = e.pointerId;
      syncPointer(e, true);
      erasedThisStrokeRef.current = new Set();

      const point = getPointFromEvent(e);
      const { activeTool, color, width } = toolSettings;

      if (activeTool === 'text') {
        const text = window.prompt('Enter text:');
        if (text && text.trim()) {
          pushHistory();
          const fontSize = width * 8;
          const bounds = estimateTextBounds(text, point.x, point.y, fontSize);
          const stroke = startStroke({
            tool: 'text',
            color,
            width,
            point,
            textContent: text.trim(),
            shapeBounds: bounds,
          });
          addStroke(stroke);
        }
        drawingRef.current = false;
        activePointerIdRef.current = null;
        canvas.releasePointerCapture(e.pointerId);
        return;
      }

      pushHistory();

      if (activeTool === 'eraser') {
        const ids = findStrokesAtPoint(strokes, point, width * 4);
        if (ids.length > 0) {
          removeStrokesByIds(ids);
        }
        return;
      }

      const stroke = startStroke({
        tool: 'pen',
        color,
        width,
        point,
      });

      addStroke(stroke);
      setActiveStrokeId(stroke.id);
    },
    [
      canvasRef,
      toolSettings,
      strokes,
      getPointFromEvent,
      syncPointer,
      pushHistory,
      addStroke,
      setActiveStrokeId,
      removeStrokesByIds,
    ]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const touchLike = isTouchLikePointer(e.pointerType);
      const mouseDrawingEnabled = useBoardStore.getState().mouseDrawingEnabled;

      if (!touchLike && !mouseDrawingEnabled) {
        setPointerState({ visible: false, active: false });
        return;
      }

      if (!drawingRef.current || activePointerIdRef.current !== e.pointerId) {
        syncPointer(e, false);
        return;
      }
      e.preventDefault();
      syncPointer(e, true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const events = e.getCoalescedEvents?.() ?? [e];
      const { activeTool, width } = toolSettings;

      for (const ev of events) {
        const point = getPointFromEvent(ev);

        if (activeTool === 'eraser') {
          const ids = findStrokesAtPoint(
            useBoardStore.getState().strokes,
            point,
            width * 4
          );
          const newIds = ids.filter((id) => !erasedThisStrokeRef.current.has(id));
          if (newIds.length > 0) {
            newIds.forEach((id) => erasedThisStrokeRef.current.add(id));
            removeStrokesByIds(newIds);
          }
          continue;
        }

        const strokeId = useBoardStore.getState().activeStrokeId;
        if (!strokeId) continue;

        if (activeTool === 'shape') {
          updateStroke(strokeId, (s) =>
            updateShapeBounds(s, {
              x1: s.shapeBounds!.x1,
              y1: s.shapeBounds!.y1,
              x2: point.x,
              y2: point.y,
            })
          );
        } else {
          updateStroke(strokeId, (s) => appendPoint(s, point));
        }
      }
    },
    [canvasRef, toolSettings, getPointFromEvent, syncPointer, setPointerState, updateStroke, removeStrokesByIds]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      endDrawing(e);
    },
    [endDrawing]
  );

  const handlePointerLeave = useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === e.pointerId) {
        endDrawing(e);
      } else {
        setPointerState({ visible: false, active: false });
      }
    },
    [endDrawing, setPointerState]
  );

  const handlePointerEnter = useCallback(
    (e: PointerEvent) => {
      syncPointer(e, drawingRef.current && activePointerIdRef.current === e.pointerId);
    },
    [syncPointer]
  );

  const handlePointerCancel = useCallback(
    (e: PointerEvent) => {
      endDrawing(e);
    },
    [endDrawing]
  );

  const handleLostPointerCapture = useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === e.pointerId) {
        drawingRef.current = false;
        activePointerIdRef.current = null;
        setActiveStrokeId(null);
        setPointerState({ visible: false, active: false });
      }
    },
    [setActiveStrokeId, setPointerState]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerenter', handlePointerEnter);
    canvas.addEventListener('lostpointercapture', handleLostPointerCapture);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('lostpointercapture', handleLostPointerCapture);
    };
  }, [
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handlePointerEnter,
    handleLostPointerCapture,
  ]);

  return { redraw };
}
