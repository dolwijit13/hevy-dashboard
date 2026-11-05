import React from 'react';
import { MonthlyBreakdown } from '../../utils/workoutAnalytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

interface MonthlyTrendsProps {
  monthlyData: MonthlyBreakdown[];
}

export const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ monthlyData }) => {
  const data = monthlyData.slice(-18);

  return (
    <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">ความถี่การฝึก & Volume รายเดือน</h3>
            <p className="text-xs text-zinc-400">จำนวน Workout (แท่ง) และ Total Volume สะสม (เส้น)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
            จำนวน Workout
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400" />
            Volume (k kg)
          </span>
        </div>
      </div>

      <div className="h-64 mt-4 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="monthKey"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'workoutsCount') return [`${value} ครั้ง`, 'จำนวน Workout'];
                  if (name === 'volumeKg') return [`${Number(value).toLocaleString()} kg`, 'Volume'];
                  return [value, name];
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="workoutsCount"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volumeKg"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            ไม่มีข้อมูลในช่วงเวลานี้
          </div>
        )}
      </div>
    </div>
  );
};
