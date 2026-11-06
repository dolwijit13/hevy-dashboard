export interface RoutineConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  cellBg: string;
  badgeClass: string;
  dotColor: string;
  textColor: string;
}

export const ROUTINE_DEFINITIONS: Record<string, RoutineConfig> = {
  routine_a: {
    id: 'routine_a',
    name: 'Routine A',
    shortName: 'A',
    description: 'Chest, Arms & Abs',
    cellBg: 'bg-sky-500 border-sky-400/80',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-500',
    textColor: 'text-sky-400',
  },
  routine_b: {
    id: 'routine_b',
    name: 'Routine B',
    shortName: 'B',
    description: 'Back & Legs / Pull',
    cellBg: 'bg-indigo-500 border-indigo-400/80',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-500',
    textColor: 'text-indigo-400',
  },
  routine_c: {
    id: 'routine_c',
    name: 'Routine C',
    shortName: 'C',
    description: 'Chest & Shoulders',
    cellBg: 'bg-amber-500 border-amber-400/80',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
  },
  routine_d: {
    id: 'routine_d',
    name: 'Routine D',
    shortName: 'D',
    description: 'Legs & Arms',
    cellBg: 'bg-rose-500 border-rose-400/80',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-400',
  },
  routine_e: {
    id: 'routine_e',
    name: 'Routine E',
    shortName: 'E',
    description: 'Shoulders & Back',
    cellBg: 'bg-fuchsia-500 border-fuchsia-400/80',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    dotColor: 'bg-fuchsia-500',
    textColor: 'text-fuchsia-400',
  },
  routine_f: {
    id: 'routine_f',
    name: 'Routine F',
    shortName: 'F',
    description: 'Routine F',
    cellBg: 'bg-lime-500 border-lime-400/80',
    badgeClass: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    dotColor: 'bg-lime-500',
    textColor: 'text-lime-400',
  },
  routine_g: {
    id: 'routine_g',
    name: 'Routine G',
    shortName: 'G',
    description: 'Routine G',
    cellBg: 'bg-yellow-500 border-yellow-400/80',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  push: {
    id: 'push',
    name: 'Push',
    shortName: 'Push',
    description: 'Chest, Shoulders & Triceps',
    cellBg: 'bg-orange-500 border-orange-400/80',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-400',
  },
  pull: {
    id: 'pull',
    name: 'Pull',
    shortName: 'Pull',
    description: 'Back, Rear Delts & Biceps',
    cellBg: 'bg-blue-500 border-blue-400/80',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-400',
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    shortName: 'Legs',
    description: 'Quads, Hamstrings & Glutes',
    cellBg: 'bg-emerald-500 border-emerald-400/80',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
  },
  upper: {
    id: 'upper',
    name: 'Upper',
    shortName: 'Upper',
    description: 'Upper Body',
    cellBg: 'bg-teal-500 border-teal-400/80',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dotColor: 'bg-teal-500',
    textColor: 'text-teal-400',
  },
  chest: {
    id: 'chest',
    name: 'Chest',
    shortName: 'Chest',
    description: 'Chest Focus',
    cellBg: 'bg-red-500 border-red-400/80',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
  },
  back: {
    id: 'back',
    name: 'Back',
    shortName: 'Back',
    description: 'Back Focus',
    cellBg: 'bg-cyan-600 border-cyan-500/80',
    badgeClass: 'bg-cyan-600/15 text-cyan-300 border-cyan-600/30',
    dotColor: 'bg-cyan-600',
    textColor: 'text-cyan-400',
  },
  shoulders: {
    id: 'shoulders',
    name: 'Shoulders',
    shortName: 'Shoulders',
    description: 'Delts & Traps',
    cellBg: 'bg-violet-600 border-violet-500/80',
    badgeClass: 'bg-violet-600/15 text-violet-300 border-violet-600/30',
    dotColor: 'bg-violet-600',
    textColor: 'text-violet-400',
  },
  arms: {
    id: 'arms',
    name: 'Arms',
    shortName: 'Arms',
    description: 'Biceps & Triceps',
    cellBg: 'bg-pink-600 border-pink-500/80',
    badgeClass: 'bg-pink-600/15 text-pink-300 border-pink-600/30',
    dotColor: 'bg-pink-600',
    textColor: 'text-pink-400',
  },
  core: {
    id: 'core',
    name: 'Core & Abs',
    shortName: 'Abs',
    description: 'Abdominals',
    cellBg: 'bg-emerald-600 border-emerald-500/80',
    badgeClass: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
    dotColor: 'bg-emerald-600',
    textColor: 'text-emerald-400',
  },
  cardio: {
    id: 'cardio',
    name: 'Cardio / Activity',
    shortName: 'Cardio',
    description: 'Walking, Night & Light Activity',
    cellBg: 'bg-slate-500 border-slate-400/80',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-500',
    textColor: 'text-slate-300',
  },
  other: {
    id: 'other',
    name: 'Other',
    shortName: 'Other',
    description: 'Miscellaneous Session',
    cellBg: 'bg-zinc-600 border-zinc-500/80',
    badgeClass: 'bg-zinc-600/15 text-zinc-300 border-zinc-600/30',
    dotColor: 'bg-zinc-600',
    textColor: 'text-zinc-400',
  },
};

/**
 * Classifies a workout session title into a standard RoutineConfig.
 */
export function getRoutineFromTitle(title?: string): RoutineConfig {
  const t = (title || '').trim();

  // 1. Standard Alphabet Routines: A, B, C, D, E, F, G
  if (/^A(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_a;
  if (/^B(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_b;
  if (/^C(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_c;
  if (/^D(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_d;
  if (/^E(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_e;
  if (/^F(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_f;
  if (/^G(\b|\s|\()/i.test(t)) return ROUTINE_DEFINITIONS.routine_g;

  // 2. PPL & Upper/Lower
  if (/^Push/i.test(t)) return ROUTINE_DEFINITIONS.push;
  if (/^Pull/i.test(t)) return ROUTINE_DEFINITIONS.pull;
  if (/^(Legs|Lower)/i.test(t)) return ROUTINE_DEFINITIONS.legs;
  if (/^Upper/i.test(t)) return ROUTINE_DEFINITIONS.upper;

  // 3. Bro split & Muscle focus
  if (/^Chest/i.test(t)) return ROUTINE_DEFINITIONS.chest;
  if (/^Back/i.test(t)) return ROUTINE_DEFINITIONS.back;
  if (/^Shoulder/i.test(t)) return ROUTINE_DEFINITIONS.shoulders;
  if (/^Arm/i.test(t)) return ROUTINE_DEFINITIONS.arms;
  if (/^Abs/i.test(t)) return ROUTINE_DEFINITIONS.core;

  // 4. Cardio, Walking & Time-based titles
  if (/Late night|Evening|Afternoon|Morning|Walking|Cardio/i.test(t)) {
    return ROUTINE_DEFINITIONS.cardio;
  }

  // 5. Check if title has hints
  if (/squat|deadlift|bench/i.test(t)) return ROUTINE_DEFINITIONS.push;

  return ROUTINE_DEFINITIONS.other;
}

/**
 * Determine the primary routine for a day that may have multiple workout sessions.
 * Resistance training sessions with volume take priority over cardio/walking sessions.
 */
export function getPrimaryRoutineForDay(
  daySessions: { title: string; totalVolumeKg?: number }[],
  fallbackTitles: string[] = []
): RoutineConfig {
  if (daySessions.length === 0) {
    if (fallbackTitles.length > 0) {
      const nonCardio = fallbackTitles.find(
        (t) => !/Late night|Evening|Afternoon|Morning|Walking|Cardio/i.test(t)
      );
      return getRoutineFromTitle(nonCardio || fallbackTitles[0]);
    }
    return ROUTINE_DEFINITIONS.other;
  }

  // Sort sessions to prioritize lifting over cardio, and highest volume first
  const sorted = [...daySessions].sort((a, b) => {
    const aVol = a.totalVolumeKg || 0;
    const bVol = b.totalVolumeKg || 0;
    const aIsCardio = aVol === 0 || /Late night|Evening|Afternoon|Morning|Walking|Cardio/i.test(a.title);
    const bIsCardio = bVol === 0 || /Late night|Evening|Afternoon|Morning|Walking|Cardio/i.test(b.title);

    if (!aIsCardio && bIsCardio) return -1;
    if (aIsCardio && !bIsCardio) return 1;
    return bVol - aVol;
  });

  return getRoutineFromTitle(sorted[0].title);
}
