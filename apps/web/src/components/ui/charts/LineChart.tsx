'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface LineChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
  color?: string;
  label?: string;
  className?: string;
}

export function LineChart({ data, isLoading, color = '#fcd34d', label = 'Count', className }: LineChartProps) {
  if (isLoading) return <Skeleton className={className ?? 'h-48 w-full'} />;

  const tickFormatter = (value: string) => {
    const d = new Date(value + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className={className ?? 'h-48 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 10, fill: 'currentColor' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 8, fontSize: 12 }}
            formatter={(value) => `${String(value ?? 0)} ${label}`}
            labelFormatter={(l) => typeof l === 'string' ? new Date(l + 'T00:00:00').toLocaleDateString() : String(l ?? '')}
          />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
