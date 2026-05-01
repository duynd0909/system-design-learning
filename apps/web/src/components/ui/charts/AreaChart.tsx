'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface AreaChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
  color?: string;
  label?: string;
  className?: string;
}

export function AreaChart({ data, isLoading, color = '#818cf8', label = 'Count', className }: AreaChartProps) {
  if (isLoading) return <Skeleton className={className ?? 'h-48 w-full'} />;

  const tickFormatter = (value: string) => {
    const d = new Date(value + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className={className ?? 'h-48 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 10, fill: 'currentColor' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 8, fontSize: 12 }}
            formatter={(value) => `${String(value ?? 0)} ${label}`}
            labelFormatter={(l) => typeof l === 'string' ? new Date(l + 'T00:00:00').toLocaleDateString() : String(l ?? '')}
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill="url(#areaGrad)" />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
