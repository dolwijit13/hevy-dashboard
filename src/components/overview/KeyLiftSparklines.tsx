import React from 'react';
import { WorkoutSet, PersonalRecord } from '../../types/fitness';
import { getExerciseProgression } from '../../utils/workoutAnalytics';
import { getExerciseMetadata } from '../../config/exerciseMuscleMap';
import { MUSCLE_ICON_MAP } from '../../config/anatomyIcons';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

interface KeyLiftSparklinesProps {
  sets: WorkoutSet[];
  allPrs: Map<string, PersonalRecord>;
  onSelectExercise: (name: string) => void;
}

export const KeyLiftSparklines: React.FC<KeyLiftSparklinesProps> = ({
  sets,
  allPrs,
  onSelectExercise,
}) => {
  const keyLiftNames = [
    'Leg Press (Machine)',
    'Chest Press (Machine)',
    'Lat Pulldown (Cable)',
    'Incline Bench Press (Dumbbell)',
    'Romanian Deadlift (Dumbbell)',
    'Hack Squat (Machine)',
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {keyLiftNames.map((liftName) => {
        const pr = allPrs.get(liftName);
        const progression = getExerciseProgression(liftName, sets);

        if (!pr || progression.length === 0) return null;

        const meta = getExerciseMetadata(liftName);
        const iconMeta = MUSCLE_ICON_MAP[meta.muscleGroup] || MUSCLE_ICON_MAP.Other;

        const sparklineData = progression.slice(-15).map((p) => ({
          weight: p.maxWeight,
          rm: p.estimated1RM,
        }));

        const isPositiveGain = (pr.progressPercent || 0) >= 0;

        return (
          <div
            key={liftName}
            onClick={() => onSelectExercise(liftName)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#141418] border border-white/10 p-4 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-[#18181e]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{iconMeta.emoji}</span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {liftName}
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-zinc-100">
                    {pr.maxWeight} <span className="text-xs text-zinc-400 font-sans font-normal">kg</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    1RM: <strong className="text-cyan-400">{pr.best1RM}kg</strong>
                  </span>
                </div>
              </div>

              {pr.progressPercent !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                    isPositiveGain
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {isPositiveGain ? '+' : ''}
                    {pr.progressPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Sparkline chart */}
            <div className="h-14 mt-3 w-full">
              {sparklineData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="rm"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-600 font-mono">
                  1 session recorded
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                <span>PR: {pr.maxWeight}kg × {pr.maxWeightReps} reps</span>
              </span>
              <span className="text-zinc-500 font-mono group-hover:text-emerald-400 transition-colors">
                Explore Details →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
