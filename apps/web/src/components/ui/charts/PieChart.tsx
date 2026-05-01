'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  isLoading?: boolean;
  className?: string;
}

export function PieChart({ data, isLoading, className }: PieChartProps) {
  if (isLoading) return <Skeleton className={className ?? 'h-48 w-full'} />;

  const nonEmpty = data.filter((d) => d.value > 0);
  if (nonEmpty.length === 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-[var(--text-secondary)] ${className ?? 'h-48 w-full'}`}>
        No data yet
      </div>
    );
  }

  return (
    <div className={className ?? 'h-48 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie data={nonEmpty} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
            {nonEmpty.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => `${String(name)}: ${String(value)}`}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
