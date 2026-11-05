import React, { useState } from 'react';
import { WorkoutSession } from '../../types/fitness';
import { getExerciseMetadata } from '../../config/exerciseMuscleMap';
import { MUSCLE_ICON_MAP } from '../../config/anatomyIcons';
import { ListFilter, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface RecentLogsProps {
  sessions: WorkoutSession[];
  onSelectExercise: (name: string) => void;
}

export const RecentLogs: React.FC<RecentLogsProps> = ({ sessions, onSelectExercise }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );

  const recentSessions = sessions.slice(0, 10);

  const toggleSession = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-2xl bg-[#141418] border border-white/10 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity Feed</h3>
            <p className="text-xs text-zinc-400">ประวัติการฝึกแยกตามเซ็ต น้ำหนัก Reps และ Note ล่าสุด</p>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Latest {recentSessions.length} sessions
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {recentSessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;

          const exerciseSetsMap = new Map<string, typeof session.sets>();
          session.sets.forEach((set) => {
            const list = exerciseSetsMap.get(set.normalizedExercise) || [];
            list.push(set);
            exerciseSetsMap.set(set.normalizedExercise, list);
          });

          return (
            <div
              key={session.id}
              className={`rounded-xl border transition-all ${
                isExpanded ? 'bg-zinc-900/90 border-white/15' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
              }`}
            >
              {/* Header bar */}
              <div
                onClick={() => toggleSession(session.id)}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{session.title}</span>
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {session.dateStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {session.durationMinutes}m
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        {session.workingSets} working sets
                      </span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">
                        {session.totalVolumeKg.toLocaleString()} kg volume
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                    {exerciseSetsMap.size} exercises
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                  {Array.from(exerciseSetsMap.entries()).map(([exerciseName, eSets]) => {
                    const meta = getExerciseMetadata(exerciseName);
                    const iconMeta = MUSCLE_ICON_MAP[meta.muscleGroup] || MUSCLE_ICON_MAP.Other;

                    return (
                      <div
                        key={exerciseName}
                        className="p-3 rounded-lg bg-zinc-950/60 border border-white/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExercise(exerciseName);
                            }}
                            className="text-xs font-semibold text-zinc-200 hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5"
                          >
                            <span className="text-sm">{iconMeta.emoji}</span>
                            <span>{exerciseName}</span>
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {eSets.length} sets
                          </span>
                        </div>

                        {/* Set pills */}
                        <div className="flex flex-wrap gap-2">
                          {eSets.map((s, idx) => (
                            <div
                              key={s.id}
                              className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 border ${
                                s.setType === 'warmup'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : s.setType === 'failure'
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                  : 'bg-zinc-800 text-zinc-200 border-zinc-700/60'
                              }`}
                            >
                              <span className="text-zinc-500 text-[10px]">#{idx + 1}</span>
                              <span className="font-bold">{s.weightKg}kg</span>
                              <span className="text-zinc-400">×</span>
                              <span>{s.reps}</span>
                              {s.rpe ? (
                                <span className="text-[10px] text-zinc-400 px-1 rounded bg-black/40">
                                  @{s.rpe}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {/* Notes if any */}
                        {eSets.some((s) => s.exerciseNotes) && (
                          <div className="mt-2 text-[11px] text-zinc-400 italic bg-zinc-900/60 p-1.5 rounded border border-white/5">
                            Note: {eSets.map((s) => s.exerciseNotes).filter(Boolean).join(' | ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
