import React, { useState, useEffect } from 'react';
import { WorkoutSession } from '../../types/fitness';
import { buildContributionHeatmap, HeatmapDay } from '../../utils/workoutAnalytics';
import { getExerciseMetadata } from '../../config/exerciseMuscleMap';
import { MUSCLE_ICON_MAP } from '../../config/anatomyIcons';
import { Calendar, Activity, Zap, X, Clock, Dumbbell, ArrowRight } from 'lucide-react';

interface HeatmapProps {
  sessions: WorkoutSession[];
  yearFilter?: string;
  onSelectExercise?: (name: string) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ sessions, yearFilter, onSelectExercise }) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [activeModalDay, setActiveModalDay] = useState<HeatmapDay | null>(null);
  const { matrix, totalActiveDays } = buildContributionHeatmap(sessions, yearFilter);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalDay(null);
    };
    if (activeModalDay) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalDay]);

  const getCellColor = (day: HeatmapDay | null) => {
    if (!day || day.count === 0) {
      return 'bg-zinc-900/80 border-white/[0.04] hover:border-zinc-500';
    }
    if (day.volumeKg > 20000) {
      return 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
    }
    if (day.volumeKg > 12000) {
      return 'bg-emerald-500 border-emerald-400';
    }
    if (day.volumeKg > 5000) {
      return 'bg-emerald-600/90 border-emerald-500/60';
    }
    return 'bg-emerald-800/90 border-emerald-700/60';
  };

  // Find all workout sessions matching the modal's active day
  const daySessions = activeModalDay
    ? sessions.filter((s) => s.dateStr === activeModalDay.dateStr)
    : [];

  return (
    <>
      <div className="relative rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Consistency Heatmap
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {totalActiveDays} active days
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                คลิกที่แต่ละช่องเพื่อดูรายละเอียด Workout ที่เล่นในวันนั้น
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 self-end sm:self-center font-mono">
            <span className="text-[11px] font-sans">Less</span>
            <span className="w-3 h-3 rounded-[3px] bg-zinc-900 border border-white/10" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-800/90 border border-emerald-700/60" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-600/90 border border-emerald-500/60" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500 border border-emerald-400" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-400 border border-emerald-300" />
            <span className="text-[11px] font-sans">More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="inline-flex gap-1.5 min-w-[700px]">
            <div className="flex flex-col gap-1.5 pr-2 justify-between text-[10px] font-mono text-zinc-500 select-none py-0.5">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            <div className="flex gap-1.5">
              {matrix.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1.5">
                  {week.map((day, dIndex) => {
                    const isSelected = activeModalDay && day && activeModalDay.dateStr === day.dateStr;
                    return (
                      <div
                        key={dIndex}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => day && setActiveModalDay(day)}
                        className={`w-3.5 h-3.5 rounded-[3px] border transition-all cursor-pointer ${
                          day ? getCellColor(day) : 'invisible'
                        } ${isSelected ? 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-[#09090b]' : ''} hover:scale-125 hover:z-20`}
                        title={day ? `${day.dateStr} (คลิกดูรายละเอียด)` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hover summary info */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs min-h-[32px]">
          {hoveredDay && hoveredDay.count > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {hoveredDay.dateStr}
              </span>
              <span className="text-emerald-400 font-medium">
                {hoveredDay.sessionTitles.join(' + ') || 'Workout'}
              </span>
              <span className="text-zinc-400 font-mono">
                Volume: <strong className="text-zinc-200">{(hoveredDay.volumeKg).toLocaleString()} kg</strong>
              </span>
              <span className="text-zinc-400 font-mono">
                Duration: <strong className="text-zinc-200">{hoveredDay.durationMinutes} mins</strong>
              </span>
              <span className="text-emerald-400/80 font-sans text-[11px] underline">
                คลิกเพื่อดูท่าฝึกและเซ็ต
              </span>
            </div>
          ) : hoveredDay ? (
            <div className="text-zinc-500 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{hoveredDay.dateStr} — Rest Day</span>
            </div>
          ) : (
            <div className="text-zinc-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>คลิกที่ช่องใดก็ได้เพื่อเปิดดูรายละเอียดท่าและเซ็ตที่เล่นในวันนั้น</span>
            </div>
          )}
        </div>
      </div>

      {/* Day Workout Detail Modal */}
      {activeModalDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveModalDay(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#141418] border border-white/15 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {activeModalDay.dateStr}
                  </span>
                  {activeModalDay.count === 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400">
                      Rest Day
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                  {activeModalDay.count > 0
                    ? activeModalDay.sessionTitles.join(' + ')
                    : 'Rest Day (พักฟื้นร่างกาย)'}
                </h3>
              </div>

              <button
                onClick={() => setActiveModalDay(null)}
                className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="ปิด (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
              {activeModalDay.count === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <p className="text-base font-medium text-zinc-300">ไม่มีการบันทึกการฝึกในวันนี้</p>
                  <p className="text-xs">ร่างกายกำลังพักฟื้นและสร้างกล้ามเนื้อ (Rest & Recovery)</p>
                </div>
              ) : (
                <>
                  {/* Daily Summary Bento Strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">Total Volume</span>
                      <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {activeModalDay.volumeKg.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">Duration</span>
                      <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                        {activeModalDay.durationMinutes} mins
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">Sessions</span>
                      <p className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                        {activeModalDay.count} workout
                      </p>
                    </div>
                  </div>

                  {/* Sessions and Exercises List */}
                  <div className="space-y-4">
                    {daySessions.map((session) => {
                      // Group sets by exercise
                      const exerciseSetsMap = new Map<string, typeof session.sets>();
                      session.sets.forEach((set) => {
                        const list = exerciseSetsMap.get(set.normalizedExercise) || [];
                        list.push(set);
                        exerciseSetsMap.set(set.normalizedExercise, list);
                      });

                      return (
                        <div
                          key={session.id}
                          className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-emerald-400" />
                              <h4 className="font-bold text-white text-sm">{session.title}</h4>
                            </div>
                            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {session.durationMinutes} mins • {session.workingSets} working sets
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {Array.from(exerciseSetsMap.entries()).map(([exName, eSets]) => {
                              const meta = getExerciseMetadata(exName);
                              const iconMeta = MUSCLE_ICON_MAP[meta.muscleGroup] || MUSCLE_ICON_MAP.Other;

                              return (
                                <div
                                  key={exName}
                                  className="p-3 rounded-lg bg-zinc-950/70 border border-white/5 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-base">{iconMeta.emoji}</span>
                                      <span className="text-xs font-bold text-zinc-100">{exName}</span>
                                    </div>
                                    {onSelectExercise && (
                                      <button
                                        onClick={() => {
                                          onSelectExercise(exName);
                                          setActiveModalDay(null);
                                        }}
                                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
                                      >
                                        <span>View Progression</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Set pills */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {eSets.map((s, idx) => (
                                      <div
                                        key={s.id}
                                        className={`px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 border ${
                                          s.setType === 'warmup'
                                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                            : s.setType === 'failure'
                                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                            : 'bg-zinc-800 text-zinc-200 border-zinc-700/60'
                                        }`}
                                      >
                                        <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                                        <span className="font-bold text-white">{s.weightKg}kg</span>
                                        <span className="text-zinc-400">×</span>
                                        <span className="text-emerald-400 font-semibold">{s.reps}</span>
                                        {s.rpe ? (
                                          <span className="text-[9px] text-zinc-400 px-1 rounded bg-black/40">
                                            @{s.rpe}
                                          </span>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Exercise notes if present */}
                                  {eSets.some((s) => s.exerciseNotes) && (
                                    <div className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-1.5 rounded border border-white/5">
                                      Note: {eSets.map((s) => s.exerciseNotes).filter(Boolean).join(' | ')}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">กด Esc หรือคลิกด้านนอกเพื่อปิด</span>
              <button
                onClick={() => setActiveModalDay(null)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
