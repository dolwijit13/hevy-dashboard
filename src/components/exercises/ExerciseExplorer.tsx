import React, { useState, useMemo, useRef } from 'react';
import { WorkoutSet, PersonalRecord } from '../../types/fitness';
import { getExerciseProgression } from '../../utils/workoutAnalytics';
import { getExerciseMetadata } from '../../config/exerciseMuscleMap';
import { MUSCLE_ICON_MAP, MOVEMENT_ICON_MAP } from '../../config/anatomyIcons';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Search, Trophy, TrendingUp, FileText } from 'lucide-react';

interface ExerciseExplorerProps {
  sets: WorkoutSet[];
  allPrs: Map<string, PersonalRecord>;
  selectedExercise: string;
  onSelectExercise: (name: string) => void;
}

export const ExerciseExplorer: React.FC<ExerciseExplorerProps> = ({
  sets,
  allPrs,
  selectedExercise,
  onSelectExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectExercise = (name: string) => {
    onSelectExercise(name);
    // Smooth scroll down to details section, especially on mobile/tablet viewports
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const exerciseList = useMemo(() => {
    const countMap = new Map<string, number>();
    sets.forEach((s) => {
      countMap.set(s.normalizedExercise, (countMap.get(s.normalizedExercise) || 0) + 1);
    });

    return Array.from(countMap.entries())
      .map(([name, count]) => {
        const meta = getExerciseMetadata(name);
        const muscleMeta = MUSCLE_ICON_MAP[meta.muscleGroup] || MUSCLE_ICON_MAP.Other;
        return {
          name,
          count,
          pr: allPrs.get(name),
          muscleMeta,
          movementType: meta.movementType,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [sets, allPrs]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exerciseList;
    const q = searchQuery.toLowerCase();
    return exerciseList.filter((e) => e.name.toLowerCase().includes(q));
  }, [exerciseList, searchQuery]);

  const currentPr = allPrs.get(selectedExercise);
  const currentMeta = getExerciseMetadata(selectedExercise);
  const currentMuscleIcon = MUSCLE_ICON_MAP[currentMeta.muscleGroup] || MUSCLE_ICON_MAP.Other;
  const currentMovementIcon = MOVEMENT_ICON_MAP[currentMeta.movementType] || { emoji: '⚡', color: 'text-zinc-400' };

  const progressionData = useMemo(() => {
    return getExerciseProgression(selectedExercise, sets);
  }, [selectedExercise, sets]);

  const yearlyPrs = useMemo(() => {
    const map = new Map<number, { maxWeight: number; best1RM: number; totalVolume: number; sessions: number }>();
    progressionData.forEach((p) => {
      const year = p.date.getFullYear();
      const prev = map.get(year) || { maxWeight: 0, best1RM: 0, totalVolume: 0, sessions: 0 };
      if (p.maxWeight > prev.maxWeight) prev.maxWeight = p.maxWeight;
      if (p.estimated1RM > prev.best1RM) prev.best1RM = p.estimated1RM;
      prev.totalVolume += p.totalVolume;
      prev.sessions += 1;
      map.set(year, prev);
    });

    return Array.from(map.entries())
      .map(([year, val]) => ({ year, ...val }))
      .sort((a, b) => b.year - a.year);
  }, [progressionData]);

  const exerciseSets = useMemo(() => {
    return sets
      .filter((s) => s.normalizedExercise === selectedExercise)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [selectedExercise, sets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Exercise Selector with Search */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-4 backdrop-blur-md">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 128 exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900/90 text-zinc-100 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="mt-3 max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
            {filteredExercises.map((e) => {
              const isSelected = e.name === selectedExercise;
              return (
                <div
                  key={e.name}
                  onClick={() => handleSelectExercise(e.name)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs select-none ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-glow-emerald'
                      : 'bg-zinc-900/40 border-white/5 text-zinc-300 hover:bg-zinc-900/80 hover:border-white/10'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate flex items-center gap-1.5">
                      <span className="text-sm shrink-0">{e.muscleMeta.emoji}</span>
                      <span className="truncate">{e.name}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
                      <span>{e.muscleMeta.label}</span>
                      <span>•</span>
                      <span>{e.count} sets</span>
                    </div>
                  </div>
                  {e.pr && e.pr.maxWeight > 0 && (
                    <span className="shrink-0 font-mono font-bold text-zinc-200 text-[11px] bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
                      {e.pr.maxWeight}kg
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono lg:hidden">
            <span>แตะท่าเพื่อเลื่อนดูกราฟด้านล่าง</span>
            <span>↓</span>
          </div>
        </div>
      </div>

      {/* Main Panel: Exercise Stats, Progression Chart, and PR Breakdowns */}
      <div ref={detailSectionRef} className="lg:col-span-8 space-y-6 scroll-mt-20">
        {/* Exercise Header & Bento Cards */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${currentMuscleIcon.badgeBg} ${currentMuscleIcon.badgeText} ${currentMuscleIcon.badgeBorder}`}>
                  <span className="text-sm">{currentMuscleIcon.emoji}</span>
                  {currentMuscleIcon.label}
                </span>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
                  <span>{currentMovementIcon.emoji}</span>
                  {currentMeta.movementType}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight flex items-center gap-2">
                <span>{currentMuscleIcon.emoji}</span>
                <span>{selectedExercise}</span>
              </h2>
            </div>
            {currentPr?.progressPercent !== undefined && (
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-400">Progression Gain:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {currentPr.progressPercent > 0 ? '+' : ''}
                  {currentPr.progressPercent}%
                </span>
              </div>
            )}
          </div>

          {/* PR Metric Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Max Weight (PR)</span>
              <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-lg text-emerald-400">
                {currentPr?.maxWeight || 0}
                <span className="text-xs font-normal text-zinc-500">kg</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentPr ? `${currentPr.maxWeightReps} reps` : '-'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Estimated 1RM</span>
              <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-lg text-cyan-400">
                {currentPr?.best1RM || 0}
                <span className="text-xs font-normal text-zinc-500">kg</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Formula: Weight × (1 + R/30)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Max Session Volume</span>
              <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-lg text-amber-400">
                {currentPr?.bestVolumeInSession?.toLocaleString() || 0}
                <span className="text-xs font-normal text-zinc-500">kg</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Single workout</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Sessions</span>
              <div className="mt-1 font-mono font-bold text-lg text-zinc-100">
                {progressionData.length}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {exerciseSets.length} sets logged
              </span>
            </div>
          </div>
        </div>

        {/* Time-series Progression Chart */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Strength & Volume Progression</h3>
              <p className="text-xs text-zinc-400">Max Weight (kg), Estimated 1RM (kg), และ Session Volume รวม</p>
            </div>
          </div>

          <div className="h-72 mt-4 w-full">
            {progressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={progressionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="dateStr"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="weight"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="kg"
                  />
                  <YAxis
                    yAxisId="volume"
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
                    formatter={(val: any, name: any) => {
                      if (name === 'maxWeight') return [`${val} kg`, 'Max Weight'];
                      if (name === 'estimated1RM') return [`${val} kg`, 'Estimated 1RM'];
                      if (name === 'totalVolume') return [`${Number(val).toLocaleString()} kg`, 'Session Volume'];
                      return [val, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    yAxisId="volume"
                    dataKey="totalVolume"
                    name="Session Volume"
                    fill="#3f3f46"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                  />
                  <Line
                    yAxisId="weight"
                    type="monotone"
                    dataKey="maxWeight"
                    name="Max Weight"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="weight"
                    type="monotone"
                    dataKey="estimated1RM"
                    name="Estimated 1RM"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                ไม่มีข้อมูลสำหรับท่านี้ในช่วงเวลาที่เลือก
              </div>
            )}
          </div>
        </div>

        {/* Yearly PR Breakdown Table */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Yearly PRs & Milestones</h3>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400 font-mono">
                  <th className="pb-2 font-medium">Year</th>
                  <th className="pb-2 font-medium">Max Weight (PR)</th>
                  <th className="pb-2 font-medium">Peak 1RM</th>
                  <th className="pb-2 font-medium">Total Volume</th>
                  <th className="pb-2 font-medium">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {yearlyPrs.map((row) => (
                  <tr key={row.year} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-white">{row.year}</td>
                    <td className="py-2.5 text-emerald-400 font-semibold">{row.maxWeight} kg</td>
                    <td className="py-2.5 text-cyan-400">{row.best1RM} kg</td>
                    <td className="py-2.5 text-zinc-300">{row.totalVolume.toLocaleString()} kg</td>
                    <td className="py-2.5 text-zinc-400">{row.sessions} sessions</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Set-by-Set History Table */}
        <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Set History & Notes</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Showing latest {Math.min(25, exerciseSets.length)} sets
            </span>
          </div>

          <div className="mt-4 overflow-x-auto max-h-[350px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#141418] z-10">
                <tr className="border-b border-white/10 text-zinc-400 font-mono">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Workout</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 font-medium">Reps</th>
                  <th className="pb-2 font-medium">1RM</th>
                  <th className="pb-2 font-medium">RPE</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {exerciseSets.slice(0, 25).map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2 text-zinc-300">{s.dateStr}</td>
                    <td className="py-2 text-zinc-400">{s.workoutTitle}</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          s.setType === 'warmup'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : s.setType === 'failure'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {s.setType}
                      </span>
                    </td>
                    <td className="py-2 font-bold text-white">{s.weightKg} kg</td>
                    <td className="py-2 text-emerald-400">{s.reps}</td>
                    <td className="py-2 text-cyan-400">{s.estimated1RM} kg</td>
                    <td className="py-2 text-zinc-400">{s.rpe ? `@${s.rpe}` : '-'}</td>
                    <td className="py-2 text-zinc-400 italic max-w-xs truncate">{s.exerciseNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
