import React from 'react';
import { KpiSummary } from '../../utils/workoutAnalytics';
import { Trophy, Flame, Clock, TrendingUp, CalendarCheck } from 'lucide-react';

interface KpiBentoProps {
  kpis: KpiSummary;
}

export const KpiBento: React.FC<KpiBentoProps> = ({ kpis }) => {
  const formatTonnage = (kg: number) => {
    if (kg >= 1_000_000) {
      return `${(kg / 1_000_000).toFixed(2)}M kg`;
    }
    if (kg >= 1_000) {
      return `${(kg / 1_000).toFixed(1)}k kg`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Avg Weekly Volume */}
      <div className="relative overflow-hidden rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md transition-all hover:border-emerald-500/30 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Avg Weekly Volume</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatTonnage(kpis.weeklyAvgVolumeKg)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Total Volume สะสม:</span>
          <span className="text-zinc-200 font-medium font-mono">{formatTonnage(kpis.totalVolumeKg)}</span>
        </div>
      </div>

      {/* 2. Completed Workouts */}
      <div className="relative overflow-hidden rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md transition-all hover:border-cyan-500/30 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Completed Workouts</span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {kpis.totalWorkouts.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400">sessions</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Total Sets ที่บันทึก:</span>
          <span className="text-zinc-200 font-medium font-mono">{kpis.totalSets.toLocaleString()} sets</span>
        </div>
      </div>

      {/* 3. Weekly Streak */}
      <div className="relative overflow-hidden rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md transition-all hover:border-amber-500/30 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Weekly Streak</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {kpis.currentWeeklyStreak}
          </span>
          <span className="text-xs text-zinc-400">weeks consecutive</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>สถิติต่อเนื่องสูงสุด:</span>
          <span className="text-amber-300 font-medium font-mono">{kpis.longestWeeklyStreak} weeks</span>
          <span className="text-zinc-500 font-mono">({kpis.totalActiveWeeks} total wks)</span>
        </div>
      </div>

      {/* 4. Personal Records (PRs) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md transition-all hover:border-emerald-500/30 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Personal Records (PRs)</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {kpis.totalPrCount}
          </span>
          <span className="text-xs text-zinc-400">exercises tracked</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>เวลาเฉลี่ยต่อ session:</span>
          <span className="text-zinc-200 font-medium font-mono">{kpis.avgDurationMinutes} นาที</span>
        </div>
      </div>
    </div>
  );
};
