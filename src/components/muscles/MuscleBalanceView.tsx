import React, { useMemo } from 'react';
import { WorkoutSet } from '../../types/fitness';
import { computeMuscleDistribution } from '../../utils/workoutAnalytics';
import { MUSCLE_ICON_MAP } from '../../config/anatomyIcons';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PieChart } from 'lucide-react';

interface MuscleBalanceViewProps {
  sets: WorkoutSet[];
}

export const MuscleBalanceView: React.FC<MuscleBalanceViewProps> = ({ sets }) => {
  const { muscles, movements, radarData } = useMemo(() => {
    return computeMuscleDistribution(sets);
  }, [sets]);

  const radarDataWithEmoji = useMemo(() => {
    return radarData.map((r) => {
      const iconMeta = MUSCLE_ICON_MAP[r.subject as keyof typeof MUSCLE_ICON_MAP];
      return {
        ...r,
        displayName: iconMeta ? `${iconMeta.emoji} ${r.subject}` : r.subject,
      };
    });
  }, [radarData]);

  const pushMovement = movements.find((m) => m.movementType === 'Push');
  const pullMovement = movements.find((m) => m.movementType === 'Pull');
  const legsMovement = movements.find((m) => m.movementType === 'Legs');
  const armsMovement = movements.find((m) => m.movementType === 'Arms');
  const coreMovement = movements.find((m) => m.movementType === 'Core');

  return (
    <div className="space-y-6">
      {/* Top Banner & Movement Split Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>⚡</span> Push
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-2xl text-white">
            {pushMovement?.sets || 0}
            <span className="text-xs font-normal text-zinc-500 font-sans ml-1">sets</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{pushMovement?.percentage || 0}%</span>
            <span>{((pushMovement?.volumeKg || 0) / 1000).toFixed(1)}k kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>🧲</span> Pull
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-2xl text-white">
            {pullMovement?.sets || 0}
            <span className="text-xs font-normal text-zinc-500 font-sans ml-1">sets</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{pullMovement?.percentage || 0}%</span>
            <span>{((pullMovement?.volumeKg || 0) / 1000).toFixed(1)}k kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>🏋️</span> Legs
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-2xl text-white">
            {legsMovement?.sets || 0}
            <span className="text-xs font-normal text-zinc-500 font-sans ml-1">sets</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{legsMovement?.percentage || 0}%</span>
            <span>{((legsMovement?.volumeKg || 0) / 1000).toFixed(1)}k kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>💪</span> Arms (Direct)
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-2xl text-white">
            {armsMovement?.sets || 0}
            <span className="text-xs font-normal text-zinc-500 font-sans ml-1">sets</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{armsMovement?.percentage || 0}%</span>
            <span>{((armsMovement?.volumeKg || 0) / 1000).toFixed(1)}k kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>🧱</span> Core
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="mt-2 font-mono font-bold text-2xl text-white">
            {coreMovement?.sets || 0}
            <span className="text-xs font-normal text-zinc-500 font-sans ml-1">sets</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{coreMovement?.percentage || 0}%</span>
            <span>{((coreMovement?.volumeKg || 0) / 1000).toFixed(1)}k kg</span>
          </div>
        </div>
      </div>

      {/* Main Charts: Radar & Sets Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-5 rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Muscle Radar</h3>
              <p className="text-xs text-zinc-400">สัดส่วนการกระจายตัวของ Working Sets ในแต่ละกลุ่มกล้ามเนื้อ</p>
            </div>
          </div>

          <div className="h-72 w-full my-auto">
            {radarDataWithEmoji.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarDataWithEmoji}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="displayName" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <PolarRadiusAxis stroke="#3f3f46" fontSize={10} />
                  <Radar
                    name="Working Sets"
                    dataKey="sets"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} sets`, 'Working Sets']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                ไม่มีข้อมูลการฝึกในช่วงเวลานี้
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-zinc-500 border-t border-white/5 pt-2">
            การกระจายตัวที่สมดุลช่วยให้รูปร่างได้สัดส่วนและลดความเสี่ยงการบาดเจ็บ
          </div>
        </div>

        {/* Sets & Tonnage by Muscle Group Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Working Sets per Muscle Group</h3>
              <p className="text-xs text-zinc-400">ปริมาณการฝึกสะสมและสัดส่วนเปอร์เซ็นต์</p>
            </div>
          </div>

          <div className="h-72 mt-4 w-full">
            {muscles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscles} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="muscleGroup"
                    type="category"
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const iconMeta = MUSCLE_ICON_MAP[val as keyof typeof MUSCLE_ICON_MAP];
                      return iconMeta ? `${iconMeta.emoji} ${val}` : val;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === 'sets') return [`${val} working sets`, 'Sets'];
                      return [val, name];
                    }}
                  />
                  <Bar dataKey="sets" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                ไม่มีข้อมูลเซ็ตที่บันทึก
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Muscle Table */}
      <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-white/5">
          Muscle Group Allocation Breakdown
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-zinc-400 font-mono">
                <th className="pb-2 font-medium">Muscle Group</th>
                <th className="pb-2 font-medium">Working Sets</th>
                <th className="pb-2 font-medium">Set Share (%)</th>
                <th className="pb-2 font-medium">Total Volume (kg)</th>
                <th className="pb-2 font-medium">Volume Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {muscles.map((m) => {
                const totalVol = muscles.reduce((acc, curr) => acc + curr.volumeKg, 0);
                const volShare = totalVol > 0 ? ((m.volumeKg / totalVol) * 100).toFixed(1) : '0';
                const iconMeta = MUSCLE_ICON_MAP[m.muscleGroup] || MUSCLE_ICON_MAP.Other;

                return (
                  <tr key={m.muscleGroup} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-white flex items-center gap-2">
                      <span className="text-base">{iconMeta.emoji}</span>
                      <span>{m.muscleGroup}</span>
                    </td>
                    <td className="py-2.5 text-zinc-200 font-semibold">{m.sets} sets</td>
                    <td className="py-2.5 text-emerald-400">{m.percentage}%</td>
                    <td className="py-2.5 text-amber-400">{m.volumeKg.toLocaleString()} kg</td>
                    <td className="py-2.5 text-zinc-400">{volShare}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
