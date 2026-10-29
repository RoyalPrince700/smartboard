import { DiagramElement, DiagramSpec } from '../../types/geometry';

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size = 10
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  element: DiagramElement,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const sx = (v: number | undefined, fallback = 0) => (v ?? fallback) * scale + offsetX;
  const sy = (v: number | undefined, fallback = 0) => (v ?? fallback) * scale + offsetY;
  const color = element.color ?? '#333333';
  const lineWidth = element.strokeWidth ?? 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  if (element.dashed) {
    ctx.setLineDash([6, 4]);
  }

  switch (element.type) {
    case 'line':
      ctx.beginPath();
      ctx.moveTo(sx(element.x1), sy(element.y1));
      ctx.lineTo(sx(element.x2), sy(element.y2));
      ctx.stroke();
      break;

    case 'arrow': {
      const x1 = sx(element.x1);
      const y1 = sy(element.y1);
      const x2 = sx(element.x2);
      const y2 = sy(element.y2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawArrowHead(ctx, x1, y1, x2, y2);
      break;
    }

    case 'circle':
      ctx.beginPath();
      ctx.arc(sx(element.cx), sy(element.cy), (element.radius ?? 20) * scale, 0, Math.PI * 2);
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      break;

    case 'rectangle': {
      const x = sx(element.x1);
      const y = sy(element.y1);
      const w = (element.width ?? (element.x2 !== undefined && element.x1 !== undefined ? element.x2 - element.x1 : 80)) * scale;
      const h = (element.height ?? (element.y2 !== undefined && element.y1 !== undefined ? element.y2 - element.y1 : 60)) * scale;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeRect(x, y, w, h);
      break;
    }

    case 'triangle':
    case 'polygon': {
      const pts = element.points ?? [
        { x: element.x1 ?? 0, y: element.y1 ?? 0 },
        { x: element.x2 ?? 0, y: element.y2 ?? 0 },
        { x: (element.x1 ?? 0) + 40, y: (element.y2 ?? 0) },
      ];
      if (pts.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
      }
      ctx.closePath();
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      break;
    }

    case 'arc':
      if (element.startAngle !== undefined && element.endAngle !== undefined) {
        ctx.beginPath();
        ctx.arc(
          sx(element.cx),
          sy(element.cy),
          (element.radius ?? 20) * scale,
          element.startAngle,
          element.endAngle,
          element.endAngle < element.startAngle
        );
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(
          sx(element.cx),
          sy(element.cy),
          (element.radius ?? 20) * scale,
          0,
          Math.PI
        );
        ctx.stroke();
      }
      break;

    case 'point':
      ctx.beginPath();
      ctx.arc(sx(element.cx ?? element.x1), sy(element.cy ?? element.y1), 4, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'label':
      ctx.font = `${Math.max(12, 14 * scale)}px system-ui, sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(element.text ?? element.label ?? '', sx(element.x1), sy(element.y1));
      break;

    default:
      break;
  }

  if (element.label && element.type !== 'label') {
    const lx = sx(element.cx ?? element.x1 ?? element.x2);
    const ly = sy((element.cy ?? element.y1 ?? element.y2) as number) - 8;
    ctx.font = `${Math.max(10, 12 * scale)}px system-ui, sans-serif`;
    ctx.fillStyle = '#444444';
    ctx.fillText(element.label, lx, ly);
  }

  ctx.restore();
}

export function renderDiagram(
  ctx: CanvasRenderingContext2D,
  diagram: DiagramSpec,
  width: number,
  height: number
): void {
  const padding = 24;
  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const scale = Math.min(availW / diagram.width, availH / diagram.height, 1);
  const offsetX = padding + (availW - diagram.width * scale) / 2;
  const offsetY = padding + (availH - diagram.height * scale) / 2;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(0, 0, width, height);

  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.fillText(diagram.title, padding, 20);

  if (diagram.description) {
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(diagram.description.slice(0, 80), padding, 38);
  }

  for (const element of diagram.elements) {
    drawElement(ctx, element, scale, offsetX, offsetY);
  }

  ctx.restore();
}
