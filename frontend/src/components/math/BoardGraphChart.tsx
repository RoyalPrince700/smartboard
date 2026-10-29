import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GraphSpec } from '../../types/math';

interface BoardGraphChartProps {
  graph: GraphSpec;
}

function samplePoints(graph: GraphSpec, maxPoints = 96) {
  const points = graph.points ?? [];
  if (points.length <= maxPoints) {
    return points.map((point) => ({
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
    }));
  }

  const step = Math.ceil(points.length / maxPoints);
  return points
    .filter((_, index) => index % step === 0)
    .map((point) => ({
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
    }));
}

export function BoardGraphChart({ graph }: BoardGraphChartProps) {
  const data = samplePoints(graph);

  return (
    <div className="w-full h-full min-h-[180px] flex flex-col">
      <p className="text-sm font-semibold text-[#0f3460] mb-1.5 font-mono shrink-0">
        {graph.displayExpression}
      </p>
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[graph.xMin, graph.xMax]}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            type="number"
            domain={[graph.yMin, graph.yMax]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              fontSize: 12,
            }}
            formatter={(value) => [String(value), 'y']}
            labelFormatter={(label) => `x = ${label}`}
          />
          <ReferenceLine x={0} stroke="#94a3b8" />
          <ReferenceLine y={0} stroke="#94a3b8" />
          {(graph.roots ?? []).map((root) => (
            <ReferenceLine key={root} x={root} stroke="#0f3460" strokeDasharray="4 4" />
          ))}
          <Line
            type="monotone"
            dataKey="y"
            stroke="#e94560"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
