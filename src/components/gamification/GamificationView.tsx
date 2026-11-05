import React, { useState, useMemo } from 'react';
import { WorkoutSession, WorkoutSet, PersonalRecord, BodyMeasurement } from '../../types/fitness';
import {
  computeRankInfo,
  computeRoutineMastery,
  computeSeasonQuest,
  computeAchievements,
} from '../../utils/gamification';
import {
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  Dumbbell,
  Target,
} from 'lucide-react';

interface GamificationViewProps {
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
  prs: Map<string, PersonalRecord>;
  measurements: BodyMeasurement[];
  onSelectRoutine?: (code: string) => void;
}

export const GamificationView: React.FC<GamificationViewProps> = ({
  sessions,
  sets,
  prs,
  measurements,
}) => {
  const prList = useMemo(() => Array.from(prs.values()), [prs]);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'strength' | 'discipline' | 'volume' | 'recomp'>('all');

  const rankInfo = useMemo(() => computeRankInfo(sessions, sets, prList), [sessions, sets, prList]);
  const routineMastery = useMemo(() => computeRoutineMastery(sessions), [sessions]);
  const seasonQuest = useMemo(() => computeSeasonQuest(sessions, sets, prList), [sessions, sets, prList]);
  const achievements = useMemo(() => computeAchievements(sessions, sets, prList, measurements), [sessions, sets, prList, measurements]);

  const filteredAchievements = useMemo(() => {
    if (achievementFilter === 'all') return achievements;
    return achievements.filter((a) => a.category === achievementFilter);
  }, [achievements, achievementFilter]);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* 1. Hero: Current Personal Rank & Next Promotion Checklist */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#121216] via-[#0d0d10] to-[#09090b] border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-zinc-900/90 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-4xl md:text-5xl shrink-0">
              <span>{rankInfo.badgeEmoji}</span>
              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-mono font-extrabold text-[11px] shadow-sm uppercase tracking-wider">
                {rankInfo.subTier}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Personal Rank Ladder
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Cycle: ~1.5 - 2 Months / Rank
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
                {rankInfo.fullName}
              </h2>
              <p className="text-sm font-medium text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{rankInfo.title}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Pill Box */}
          <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5 font-mono text-xs">
            <div className="px-3 border-r border-white/10">
              <span className="text-zinc-500 block text-[10px] uppercase">Lifetime XP</span>
              <span className="font-bold text-emerald-400 text-sm">{rankInfo.currentXp.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 ml-0.5">kg</span>
            </div>
            <div className="px-3">
              <span className="text-zinc-500 block text-[10px] uppercase">Next Promotion</span>
              <span className="font-bold text-white text-sm">{rankInfo.nextRankName}</span>
              <span className="text-[10px] text-zinc-400 block font-sans">ในอีก ~{rankInfo.estMonthsToNextRank} เดือน</span>
            </div>
          </div>
        </div>

        {/* Progress Bar towards Next Sub-Tier */}
        <div className="relative mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">
              Progress to <strong className="text-white">{rankInfo.nextRankName}</strong>
            </span>
            <span className="text-emerald-400 font-bold">{rankInfo.progressPercent}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/10 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 shadow-glow-emerald"
              style={{ width: `${Math.max(5, rankInfo.progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>{rankInfo.tierStartXp.toLocaleString()} kg</span>
            <span>
              เหลืออีก <strong className="text-zinc-300">{rankInfo.remainingXp.toLocaleString()} kg</strong> (~{rankInfo.estWorkoutsToNextRank} workouts)
            </span>
            <span>{rankInfo.tierTargetXp.toLocaleString()} kg</span>
          </div>
        </div>

        {/* Promotion Checklist (The Exam) */}
        <div className="relative mt-6 pt-5 border-t border-white/5">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Promotion Exam Checklist (เงื่อนไขเลื่อนยศรอบนี้)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rankInfo.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  item.isMet
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{item.label}</p>
                  <p className="text-[11px] font-mono mt-0.5 text-zinc-400">
                    {item.current} / <span className="text-zinc-200">{item.target}</span>
                  </p>
                </div>
                {item.isMet ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-zinc-600 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                    ...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Season 4 Quest Card (Q4 2026: 90-Day Quarterly Pass) */}
      <div className="rounded-3xl bg-[#141418] border border-white/10 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{seasonQuest.seasonName}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                ภารกิจรายไตรมาส (3 เดือน) • สิ้นสุดในอีก <strong className="text-amber-400 font-mono">{seasonQuest.daysRemaining} วัน</strong>
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs self-start sm:self-center">
            Season Progress: {seasonQuest.overallPercent}%
          </div>
        </div>

        {/* 3 Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Volume Goal</span>
              <span className="text-white font-bold">{seasonQuest.volumePercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${seasonQuest.volumePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {seasonQuest.volumeXp.toLocaleString()} / {seasonQuest.volumeTarget.toLocaleString()} kg
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Workouts Count</span>
              <span className="text-white font-bold">{seasonQuest.sessionsPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${seasonQuest.sessionsPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {seasonQuest.sessionsCount} / {seasonQuest.sessionsTarget} ครั้ง (~14 ครั้ง/เดือน)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">New PRs</span>
              <span className="text-white font-bold">{seasonQuest.prPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${seasonQuest.prPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {seasonQuest.prCount} / {seasonQuest.prTarget} ท่าใหม่
            </p>
          </div>
        </div>

        {/* Milestones list */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {seasonQuest.milestones.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                m.isUnlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-zinc-900/40 border-white/5 text-zinc-500'
              }`}
            >
              <div>
                <p className="font-semibold text-white text-[11px]">{m.reward}</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{m.label}</p>
              </div>
              {m.isUnlocked && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Routine Split Mastery (A, B, C, D, E & Night Sessions) */}
      <div className="rounded-3xl bg-[#141418] border border-white/10 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Routine Split Mastery
              </h3>
              <p className="text-xs text-zinc-400">
                ระดับความเชี่ยวชาญในแต่ละ Routine (เก็บเลเวล 1 ดาว ทุกๆ ~10-15 เซสชัน)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {routineMastery.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    {r.code}
                  </span>
                  <span className="text-base">{r.emojis}</span>
                </div>

                <h4 className="font-bold text-sm text-white mt-2">{r.name}</h4>

                {/* Stars Rating */}
                <div className="flex items-center gap-1 mt-1 text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < r.stars ? 'text-amber-400' : 'text-zinc-700'}>
                      ★
                    </span>
                  ))}
                  <span className="text-[11px] font-mono text-zinc-400 ml-1.5 font-bold">
                    Lv.{r.stars}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>{r.sessionCount} เซสชัน</span>
                  <span className="text-zinc-300 font-semibold">{r.totalTonnage.toLocaleString()} kg</span>
                </div>
              </div>

              {/* Progress to next star */}
              <div className="mt-3 pt-2.5 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>Next Star: {r.sessionCount} / {r.nextStarThreshold}</span>
                  <span>{r.progressPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${r.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Achievement Showcase (Trophy Case) */}
      <div className="rounded-3xl bg-[#141418] border border-white/10 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Achievement Hall of Fame</span>
                <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {unlockedCount} / {achievements.length} ปลดล็อกแล้ว
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                เหรียญรางวัลเกียรติยศที่คำนวณจากประวัติการฝึก 801 เซสชันในอดีตของคุณ
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'strength', label: '👑 Strength' },
                { id: 'discipline', label: '🛡️ Discipline' },
                { id: 'volume', label: '🚛 Volume' },
                { id: 'recomp', label: '📐 Recomp' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAchievementFilter(opt.id)}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  achievementFilter === opt.id
                    ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {filteredAchievements.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                a.isUnlocked
                  ? 'bg-gradient-to-br from-zinc-900/80 to-[#121816] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                  : 'bg-zinc-900/30 border-white/5 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                  a.isUnlocked
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-glow-emerald'
                    : 'bg-zinc-800/50 border-white/5 grayscale'
                }`}
              >
                {a.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white truncate">{a.title}</h4>
                  {a.isUnlocked && (
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold shrink-0 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Unlocked
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                  {a.description}
                </p>

                {/* Progress bar if not yet unlocked */}
                {!a.isUnlocked && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>Progress</span>
                      <span>
                        {a.progress} / {a.maxProgress} {a.unit}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((a.progress / a.maxProgress) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
