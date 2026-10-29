import { GraphSpec } from '../../types/math';

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  graph: GraphSpec,
  width: number,
  height: number
): void {
  const padding = 40;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const xRange = graph.xMax - graph.xMin || 1;
  const yRange = graph.yMax - graph.yMin || 1;

  const toScreenX = (x: number) => padding + ((x - graph.xMin) / xRange) * plotW;
  const toScreenY = (y: number) => padding + plotH - ((y - graph.yMin) / yRange) * plotH;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  const xZero = toScreenX(0);
  const yZero = toScreenY(0);

  if (xZero >= padding && xZero <= width - padding) {
    ctx.beginPath();
    ctx.moveTo(xZero, padding);
    ctx.lineTo(xZero, height - padding);
    ctx.stroke();
  }

  if (yZero >= padding && yZero <= height - padding) {
    ctx.beginPath();
    ctx.moveTo(padding, yZero);
    ctx.lineTo(width - padding, yZero);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ccc';
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const x = graph.xMin + (xRange * i) / gridSteps;
    const sx = toScreenX(x);
    ctx.beginPath();
    ctx.moveTo(sx, padding);
    ctx.lineTo(sx, height - padding);
    ctx.stroke();
  }
  for (let i = 0; i <= gridSteps; i++) {
    const y = graph.yMin + (yRange * i) / gridSteps;
    const sy = toScreenY(y);
    ctx.beginPath();
    ctx.moveTo(padding, sy);
    ctx.lineTo(width - padding, sy);
    ctx.stroke();
  }

  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  let started = false;
  for (const point of graph.points) {
    const sx = toScreenX(point.x);
    const sy = toScreenY(point.y);
    if (!started) {
      ctx.moveTo(sx, sy);
      started = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();

  if (graph.roots?.length) {
    ctx.fillStyle = '#0f3460';
    for (const root of graph.roots) {
      const sx = toScreenX(root);
      const sy = toScreenY(0);
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(graph.displayExpression, padding, 24);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  ctx.fillText(`x: [${graph.xMin}, ${graph.xMax}]`, width - padding, height - 10);

  ctx.restore();
}
