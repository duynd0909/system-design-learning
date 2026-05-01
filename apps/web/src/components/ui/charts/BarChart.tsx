'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface BarChartProps {
  data: Array<{ title: string; passRate: number }>;
  isLoading?: boolean;
  color?: string;
  className?: string;
}

export function BarChart({ data, isLoading, color = '#34d399', className }: BarChartProps) {
  if (isLoading) return <Skeleton className={className ?? 'h-48 w-full'} />;

  const truncate = (s: string, n = 16) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className={className ?? 'h-48 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.15)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }} unit="%" />
          <YAxis type="category" dataKey="title" width={90} tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v: string) => truncate(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 8, fontSize: 12 }}
            formatter={(value) => `${String(value ?? 0)}% pass rate`}
          />
          <Bar dataKey="passRate" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.85} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
