import { useEffect, useRef } from 'react';
import { renderDiagram } from '../../engine/diagram/DiagramRenderer';
import { useAIStore } from '../../stores/aiStore';

export function DiagramOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentDiagram = useAIStore((s) => s.currentDiagram);
  const showDiagram = useAIStore((s) => s.showDiagram);

  useEffect(() => {
    if (!showDiagram || !currentDiagram) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderDiagram(ctx, currentDiagram, rect.width, rect.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [showDiagram, currentDiagram]);

  if (!showDiagram || !currentDiagram) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
