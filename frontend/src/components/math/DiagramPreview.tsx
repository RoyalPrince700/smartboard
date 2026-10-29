import type { DiagramElement, DiagramSpec } from '../../types/geometry';

interface DiagramPreviewProps {
  diagram: DiagramSpec;
  className?: string;
  hideTitle?: boolean;
}

function fillColor(color: string): string {
  return color;
}

function arrowPoints(x1: number, y1: number, x2: number, y2: number, size = 10): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const left = {
    x: x2 - size * Math.cos(angle - Math.PI / 6),
    y: y2 - size * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: x2 - size * Math.cos(angle + Math.PI / 6),
    y: y2 - size * Math.sin(angle + Math.PI / 6),
  };
  return `${x2},${y2} ${left.x},${left.y} ${right.x},${right.y}`;
}

function renderElement(element: DiagramElement, index: number) {
  const color = element.color ?? '#1f2937';
  const strokeWidth = element.strokeWidth ?? 2;
  const dash = element.dashed ? '6 4' : undefined;
  const key = `${element.type}-${index}`;

  switch (element.type) {
    case 'line':
      return (
        <line
          key={key}
          x1={element.x1}
          y1={element.y1}
          x2={element.x2}
          y2={element.y2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeLinecap="round"
        />
      );
    case 'arrow':
      return (
        <g key={key}>
          <line
            x1={element.x1}
            y1={element.y1}
            x2={element.x2}
            y2={element.y2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <polygon
            points={arrowPoints(element.x1 ?? 0, element.y1 ?? 0, element.x2 ?? 0, element.y2 ?? 0)}
            fill={color}
          />
        </g>
      );
    case 'circle':
      return (
        <circle
          key={key}
          cx={element.cx}
          cy={element.cy}
          r={element.radius ?? 20}
          fill={fillColor(color)}
          fillOpacity={0.08}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
    case 'rectangle': {
      const x = element.x1 ?? 0;
      const y = element.y1 ?? 0;
      const width =
        element.width ?? (element.x2 !== undefined && element.x1 !== undefined ? element.x2 - element.x1 : 80);
      const height =
        element.height ?? (element.y2 !== undefined && element.y1 !== undefined ? element.y2 - element.y1 : 60);
      return (
        <rect
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor(color)}
          fillOpacity={0.06}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      );
    }
    case 'triangle':
    case 'polygon': {
      const pts = element.points ?? [];
      if (pts.length < 2) return null;
      return (
        <polygon
          key={key}
          points={pts.map((point) => `${point.x},${point.y}`).join(' ')}
          fill={fillColor(color)}
          fillOpacity={0.06}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    }
    case 'arc': {
      const cx = element.cx ?? 0;
      const cy = element.cy ?? 0;
      const radius = element.radius ?? 20;
      if (element.startAngle !== undefined && element.endAngle !== undefined) {
        const startX = cx + radius * Math.cos(element.startAngle);
        const startY = cy + radius * Math.sin(element.startAngle);
        const endX = cx + radius * Math.cos(element.endAngle);
        const endY = cy + radius * Math.sin(element.endAngle);
        const delta = element.endAngle - element.startAngle;
        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweep = delta >= 0 ? 1 : 0;
        return (
          <path
            key={key}
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      }
      const startX = cx + radius;
      const startY = cy;
      const endX = cx;
      const endY = cy - radius;
      return (
        <path
          key={key}
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 0 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    }
    case 'point':
      return (
        <circle
          key={key}
          cx={element.cx ?? element.x1}
          cy={element.cy ?? element.y1}
          r={4}
          fill={color}
        />
      );
    case 'label':
      return (
        <text
          key={key}
          x={element.x1}
          y={element.y1}
          fill={color}
          fontSize={16}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {element.text ?? element.label ?? ''}
        </text>
      );
    default:
      return null;
  }
}

export function DiagramPreview({ diagram, className, hideTitle = true }: DiagramPreviewProps) {
  return (
    <figure className={className}>
      {!hideTitle && diagram.title ? (
        <figcaption className="mb-2 text-sm font-semibold text-slate-700">{diagram.title}</figcaption>
      ) : null}
      <svg
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="img"
        aria-label={diagram.title || diagram.description || 'Geometry diagram'}
        className="h-auto w-full max-h-72"
      >
        <rect width={diagram.width} height={diagram.height} fill="#f8fafc" rx="16" />
        {diagram.elements.map((element, index) => renderElement(element, index))}
      </svg>
    </figure>
  );
}
