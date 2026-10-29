import { useCallback, useEffect, useRef, useState } from 'react';
import { screenToBoardPoint, setBoardTransform } from '../../utils/boardCoordinates';
import { recognizeGeometry } from '../../utils/geometryRecognition';
import { renderGeometryCanvas, renderInputCanvas } from '../../utils/geometryRendering';
import { shapeIdFor } from '../../utils/shapeLibrary';
import type { Point, RawStroke, RecognizedGeometry, WhiteboardScene } from '../../types/whiteboardGeometry';

const STROKE_COLOR = '#1e293b';
const STROKE_WIDTH = 12;
const MIN_POINT_DISTANCE = 2;

function createStrokeId(): string {
  return `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SplitWhiteboardProps {
  onClear?: () => void;
}

export function SplitWhiteboard({ onClear }: SplitWhiteboardProps) {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scene, setScene] = useState<WhiteboardScene>({
    rawStrokes: [],
    geometryObjects: [],
  });

  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const activeStrokeRef = useRef<RawStroke | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const getViewport = useCallback((panel: HTMLElement) => {
    return {
      width: panel.clientWidth,
      height: panel.clientHeight,
    };
  }, []);

  const resizeCanvas = useCallback(
    (canvas: HTMLCanvasElement, panel: HTMLElement, allowBufferResize: boolean) => {
      const dpr = window.devicePixelRatio || 1;
      const viewport = getViewport(panel);
      const nextWidth = Math.max(1, Math.floor(viewport.width * dpr));
      const nextHeight = Math.max(1, Math.floor(viewport.height * dpr));

      if (allowBufferResize && (canvas.width !== nextWidth || canvas.height !== nextHeight)) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      return { viewport, dpr };
    },
    [getViewport]
  );

  const redrawLeft = useCallback(() => {
    const canvas = leftCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const panel = container.querySelector<HTMLElement>('[data-panel="input"]');
    if (!panel) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { viewport, dpr } = resizeCanvas(canvas, panel, !isDrawingRef.current);
    renderInputCanvas(
      ctx,
      viewport,
      dpr,
      sceneRef.current.rawStrokes,
      activeStrokeRef.current
    );
  }, [resizeCanvas]);

  const redrawRight = useCallback(() => {
    const canvas = rightCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const panel = container.querySelector<HTMLElement>('[data-panel="geometry"]');
    if (!panel) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { viewport, dpr } = resizeCanvas(canvas, panel, true);
    renderGeometryCanvas(ctx, viewport, dpr, sceneRef.current.geometryObjects);
  }, [resizeCanvas]);

  const redrawAll = useCallback(() => {
    redrawLeft();
    redrawRight();
  }, [redrawLeft, redrawRight]);

  const scheduleLeftRedraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      redrawLeft();
    });
  }, [redrawLeft]);

  const paintLiveSegment = useCallback((from: Point, to: Point, color: string, width: number) => {
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    setBoardTransform(
      ctx,
      { width: rect.width, height: rect.height },
      window.devicePixelRatio || 1
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  const redrawLeftRef = useRef(redrawLeft);
  const scheduleLeftRedrawRef = useRef(scheduleLeftRedraw);
  const paintLiveSegmentRef = useRef(paintLiveSegment);
  redrawLeftRef.current = redrawLeft;
  scheduleLeftRedrawRef.current = scheduleLeftRedraw;
  paintLiveSegmentRef.current = paintLiveSegment;

  useEffect(() => {
    redrawAll();
    window.addEventListener('resize', redrawAll);
    window.addEventListener('orientationchange', redrawAll);
    window.visualViewport?.addEventListener('resize', redrawAll);
    return () => {
      window.removeEventListener('resize', redrawAll);
      window.removeEventListener('orientationchange', redrawAll);
      window.visualViewport?.removeEventListener('resize', redrawAll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [redrawAll, scene]);

  const finishStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    activePointerIdRef.current = null;

    const finishedStroke = activeStrokeRef.current;
    activeStrokeRef.current = null;

    if (!finishedStroke || finishedStroke.points.length === 0) {
      scheduleLeftRedrawRef.current();
      return;
    }

    const recognition = recognizeGeometry(finishedStroke.points);
    const recognized: RecognizedGeometry = {
      id: `geom-${finishedStroke.id}`,
      rawStrokeId: finishedStroke.id,
      shapeId: shapeIdFor(recognition.geometry),
      geometry: recognition.geometry,
      confidence: recognition.confidence,
      color: finishedStroke.color,
      width: finishedStroke.width,
    };

    setScene((prev) => ({
      rawStrokes: [...prev.rawStrokes, finishedStroke],
      geometryObjects: [...prev.geometryObjects, recognized],
    }));
  }, []);

  const finishStrokeRef = useRef(finishStroke);
  finishStrokeRef.current = finishStroke;

  useEffect(() => {
    const canvas = leftCanvasRef.current;
    if (!canvas) return;

    const isActivePointer = (event: PointerEvent) =>
      activePointerIdRef.current === null || event.pointerId === activePointerIdRef.current;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();

      isDrawingRef.current = true;
      activePointerIdRef.current = event.pointerId;

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Drawing continues via window listeners even without capture.
      }

      const point = screenToBoardPoint(event.clientX, event.clientY, canvas);
      activeStrokeRef.current = {
        id: createStrokeId(),
        points: [point],
        color: STROKE_COLOR,
        width: STROKE_WIDTH,
      };
      redrawLeftRef.current();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDrawingRef.current || !activeStrokeRef.current || !isActivePointer(event)) return;
      event.preventDefault();

      const stroke = activeStrokeRef.current;
      const point = screenToBoardPoint(event.clientX, event.clientY, canvas);
      const last = stroke.points[stroke.points.length - 1];

      if (last && Math.hypot(point.x - last.x, point.y - last.y) < MIN_POINT_DISTANCE) {
        return;
      }

      if (last) {
        paintLiveSegmentRef.current(last, point, stroke.color, stroke.width);
      }

      stroke.points.push(point);
      scheduleLeftRedrawRef.current();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isDrawingRef.current || !isActivePointer(event)) return;
      event.preventDefault();

      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore if capture was already released.
      }

      finishStrokeRef.current();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const clearBoard = () => {
    activeStrokeRef.current = null;
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    setScene({ rawStrokes: [], geometryObjects: [] });
    onClearRef.current?.();
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 min-h-0 w-full">
      <div
        data-panel="input"
        className="flex-1 min-w-0 border-r border-slate-300 relative bg-white"
      >
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-slate-900/75 text-white text-xs font-medium pointer-events-none landscape-board:top-12">
          Draw here
        </div>
        <canvas
          ref={leftCanvasRef}
          className="block w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div data-panel="geometry" className="flex-1 min-w-0 relative bg-white">
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-emerald-700/85 text-white text-xs font-medium pointer-events-none">
          Perfect geometry
        </div>
        <canvas ref={rightCanvasRef} className="block w-full h-full pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={clearBoard}
        className="absolute bottom-4 right-4 z-20 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 shadow-lg landscape-board:bottom-[max(0.75rem,env(safe-area-inset-bottom))] landscape-board:right-[max(0.75rem,env(safe-area-inset-right))]"
      >
        Clear
      </button>
    </div>
  );
}
