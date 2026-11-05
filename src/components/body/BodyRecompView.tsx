import React from 'react';
import { BodyMeasurement } from '../../types/fitness';
import { BODY_PART_ICONS } from '../../config/anatomyIcons';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Scale, HeartPulse, Sparkles, Activity, ArrowRightLeft } from 'lucide-react';

interface BodyRecompViewProps {
  measurements: BodyMeasurement[];
}

export const BodyRecompView: React.FC<BodyRecompViewProps> = ({ measurements }) => {
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const earliest = measurements.length > 0 ? measurements[0] : null;

  const weightChange =
    latest?.weightKg && earliest?.weightKg
      ? Number((latest.weightKg - earliest.weightKg).toFixed(1))
      : 0;

  const latestLean = latest?.leanMassKg;
  const earliestLean = measurements.find((m) => m.leanMassKg !== undefined)?.leanMassKg;
  const leanMassChange =
    latestLean && earliestLean ? Number((latestLean - earliestLean).toFixed(1)) : 0;

  const latestBicepSymmetry = [...measurements].reverse().find(
    (m) => m.leftBicepCm !== undefined && m.rightBicepCm !== undefined
  );
  const latestThighSymmetry = [...measurements].reverse().find(
    (m) => m.leftThighCm !== undefined && m.rightThighCm !== undefined
  );
  const latestCalfSymmetry = [...measurements].reverse().find(
    (m) => m.leftCalfCm !== undefined && m.rightCalfCm !== undefined
  );
  const latestForearmSymmetry = [...measurements].reverse().find(
    (m) => m.leftForearmCm !== undefined && m.rightForearmCm !== undefined
  );

  const symmetryList = [
    {
      part: 'Biceps',
      emoji: BODY_PART_ICONS.Biceps,
      left: latestBicepSymmetry?.leftBicepCm,
      right: latestBicepSymmetry?.rightBicepCm,
      diff: latestBicepSymmetry?.bicepDiff,
    },
    {
      part: 'Forearms',
      emoji: BODY_PART_ICONS.Forearms,
      left: latestForearmSymmetry?.leftForearmCm,
      right: latestForearmSymmetry?.rightForearmCm,
      diff: latestForearmSymmetry?.forearmDiff,
    },
    {
      part: 'Thighs',
      emoji: BODY_PART_ICONS.Thighs,
      left: latestThighSymmetry?.leftThighCm,
      right: latestThighSymmetry?.rightThighCm,
      diff: latestThighSymmetry?.thighDiff,
    },
    {
      part: 'Calves',
      emoji: BODY_PART_ICONS.Calves,
      left: latestCalfSymmetry?.leftCalfCm,
      right: latestCalfSymmetry?.rightCalfCm,
      diff: latestCalfSymmetry?.calfDiff,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Recomp KPI Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>⚖️</span> Body Weight
            </span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-white">{latest?.weightKg || '-'}</span>
            <span className="text-xs text-zinc-500 font-sans">kg</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span>Overall:</span>
            <span className={weightChange >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {weightChange >= 0 ? `+${weightChange}` : weightChange} kg
            </span>
          </div>
        </div>

        {/* Body Fat % */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>🩺</span> Body Fat %
            </span>
            <HeartPulse className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-cyan-400">
              {latest?.fatPercent !== undefined ? `${latest.fatPercent}%` : '-'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span>Fat Mass:</span>
            <span className="text-zinc-200">{latest?.fatMassKg ? `${latest.fatMassKg} kg` : '-'}</span>
          </div>
        </div>

        {/* Lean Body Mass */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>✨</span> Lean Body Mass
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-amber-400">{latest?.leanMassKg || '-'}</span>
            <span className="text-xs text-zinc-500 font-sans">kg</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span>Muscle Gain:</span>
            <span className="text-emerald-400 font-bold">
              {leanMassChange > 0 ? `+${leanMassChange}` : leanMassChange} kg
            </span>
          </div>
        </div>

        {/* V-Taper Index */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5">
              <span>⏳</span> V-Taper (Shoulder / Waist)
            </span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-purple-400">
              {latest?.vTaperShoulderWaist || '-'}
            </span>
            <span className="text-xs text-zinc-500 font-sans">ratio</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <span>Chest / Waist:</span>
            <span className="text-zinc-200">{latest?.vTaperChestWaist || '-'}</span>
          </div>
        </div>
      </div>

      {/* Main Chart: Weight & Lean Mass & Body Fat */}
      <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>📈</span>
              <span>Body Recomposition Timeline (2023 - 2026)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Total Weight (kg), Lean Body Mass (kg) ทางแกนซ้าย และ % ไขมันทางแกนขวา
            </p>
          </div>
        </div>

        <div className="h-72 mt-4 w-full">
          {measurements.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={measurements} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="dateStr" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="weight"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  unit="kg"
                />
                <YAxis
                  yAxisId="fat"
                  orientation="right"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[10, 25]}
                  unit="%"
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
                    if (name.includes('Weight')) return [`${val} kg`, 'Body Weight'];
                    if (name.includes('Lean Mass')) return [`${val} kg`, 'Lean Body Mass'];
                    if (name.includes('Fat')) return [`${val} %`, 'Body Fat %'];
                    return [val, name];
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name="⚖️ Weight (kg)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 3, fill: '#10b981' }}
                />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="leanMassKg"
                  name="✨ Lean Mass (kg)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
                <Line
                  yAxisId="fat"
                  type="monotone"
                  dataKey="fatPercent"
                  name="🩺 Body Fat %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  connectNulls
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
              ไม่มีข้อมูลสัดส่วนร่างกายในช่วงเวลานี้
            </div>
          )}
        </div>
      </div>

      {/* Circumference Evolution & Symmetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circumference Progression */}
        <div className="lg:col-span-7 rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>📏</span>
                <span>Body Circumferences (cm)</span>
              </h3>
              <p className="text-xs text-zinc-400">รอบอก รอบเอว สะโพก และรอบหัวไหล่ตลอดช่วงเวลา</p>
            </div>
          </div>

          <div className="h-72 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={measurements} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="dateStr" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  unit="cm"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [`${val} cm`, name]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="chestCm"
                  name="🍼 Chest"
                  stroke="#10b981"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="waistCm"
                  name="⏳ Waist"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
                <Line
                  type="monotone"
                  dataKey="hipsCm"
                  name="🍑 Hips"
                  stroke="#a855f7"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: '#a855f7' }}
                />
                <Line
                  type="monotone"
                  dataKey="shoulderCm"
                  name="🪖 Shoulders"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Left vs Right Limb Symmetry */}
        <div className="lg:col-span-5 rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>⚖️</span>
                <span>Limb Symmetry (Left vs Right)</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              เปรียบเทียบขนาดข้างซ้ายและข้างขวาจากการวัดล่าสุด
            </p>

            <div className="mt-4 space-y-3.5">
              {symmetryList.map((item) => {
                const diff = item.diff ?? 0;
                const isBalanced = Math.abs(diff) <= 0.5;

                return (
                  <div
                    key={item.part}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-base">{item.emoji}</span>
                        <span>{item.part}</span>
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                        <span>Left (L): <strong className="text-zinc-200">{item.left ?? '-'}</strong> cm</span>
                        <span>Right (R): <strong className="text-zinc-200">{item.right ?? '-'}</strong> cm</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border inline-block ${
                          isBalanced
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff} cm
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {isBalanced ? 'Balanced' : diff > 0 ? 'Right Dominant' : 'Left Dominant'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 text-center font-mono">
            ความต่าง &lt; 0.5 cm ถือว่าอยู่ในเกณฑ์สมดุลตามธรรมชาติ
          </div>
        </div>
      </div>
    </div>
  );
};
