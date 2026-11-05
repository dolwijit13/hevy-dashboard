import {
  WorkoutSet,
  WorkoutSession,
  PersonalRecord,
  TimeFilter,
  CustomDateRange,
  MuscleGroup,
  MovementType,
} from '../types/fitness';

export function filterByTimeRange<T extends { startTime: Date }>(
  items: T[],
  timeFilter: TimeFilter,
  referenceDate?: Date,
  customRange?: CustomDateRange
): T[] {
  if (timeFilter === 'all') return items;

  if (timeFilter === 'custom' && customRange) {
    const startMs = new Date(`${customRange.startDate}T00:00:00`).getTime();
    const endMs = new Date(`${customRange.endDate}T23:59:59`).getTime();
    return items.filter((item) => {
      const t = item.startTime.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  if (['2023', '2024', '2025', '2026'].includes(timeFilter)) {
    const targetYear = parseInt(timeFilter, 10);
    return items.filter((item) => item.startTime.getFullYear() === targetYear);
  }

  // Relative filters ('90d', '30d')
  const refTime = referenceDate
    ? referenceDate.getTime()
    : items.length > 0
    ? Math.max(...items.map((i) => i.startTime.getTime()))
    : new Date().getTime();

  const days = timeFilter === '30d' ? 30 : 90;
  const cutoff = refTime - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => item.startTime.getTime() >= cutoff);
}

export function getISOWeekNumber(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekIndex(weekKey: string): number {
  const [y, w] = weekKey.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000 + (w - 1) * 7 * 86400000);
  return Math.round(monday.getTime() / (7 * 86400000));
}

export function calculateWeeklyStreaks(sessions: WorkoutSession[]): {
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
  totalActiveWeeks: number;
} {
  if (sessions.length === 0) {
    return { currentWeeklyStreak: 0, longestWeeklyStreak: 0, totalActiveWeeks: 0 };
  }

  const weekSet = new Set<string>();
  sessions.forEach((s) => {
    weekSet.add(getISOWeekNumber(s.startTime));
  });

  const sortedWeeks = Array.from(weekSet).sort();
  if (sortedWeeks.length === 0) {
    return { currentWeeklyStreak: 0, longestWeeklyStreak: 0, totalActiveWeeks: 0 };
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedWeeks.length; i++) {
    const prevIdx = getWeekIndex(sortedWeeks[i - 1]);
    const currIdx = getWeekIndex(sortedWeeks[i]);

    if (currIdx - prevIdx === 1) {
      current++;
      if (current > longest) longest = current;
    } else if (currIdx - prevIdx > 1) {
      current = 1;
    }
  }

  return {
    currentWeeklyStreak: current,
    longestWeeklyStreak: longest,
    totalActiveWeeks: sortedWeeks.length,
  };
}

export interface KpiSummary {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSets: number;
  avgDurationMinutes: number;
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
  totalActiveWeeks: number;
  weeklyAvgVolumeKg: number;
  totalExercises: number;
  totalPrCount: number;
}

export function computeKpis(
  sessions: WorkoutSession[],
  sets: WorkoutSet[],
  allPrs: PersonalRecord[]
): KpiSummary {
  const totalWorkouts = sessions.length;
  const totalVolumeKg = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalSets = sets.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgDurationMinutes = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  const { currentWeeklyStreak, longestWeeklyStreak, totalActiveWeeks } = calculateWeeklyStreaks(sessions);

  // Compute weeks span for weekly average volume
  let weeklyAvgVolumeKg = 0;
  if (sessions.length > 0) {
    const minTime = Math.min(...sessions.map((s) => s.startTime.getTime()));
    const maxTime = Math.max(...sessions.map((s) => s.startTime.getTime()));
    const diffWeeks = Math.max(1, (maxTime - minTime) / (1000 * 60 * 60 * 24 * 7));
    weeklyAvgVolumeKg = Math.round(totalVolumeKg / diffWeeks);
  }

  const uniqueExercises = new Set(sets.map((s) => s.normalizedExercise)).size;

  return {
    totalWorkouts,
    totalVolumeKg,
    totalSets,
    avgDurationMinutes,
    currentWeeklyStreak,
    longestWeeklyStreak,
    totalActiveWeeks,
    weeklyAvgVolumeKg,
    totalExercises: uniqueExercises,
    totalPrCount: allPrs.length,
  };
}

export interface HeatmapDay {
  dateStr: string;
  date: Date;
  count: number;
  volumeKg: number;
  durationMinutes: number;
  sessionTitles: string[];
}

export function buildContributionHeatmap(
  sessions: WorkoutSession[],
  yearFilter?: string,
  customRange?: CustomDateRange
): { matrix: (HeatmapDay | null)[][]; totalActiveDays: number } {
  const now = sessions.length > 0 ? new Date(Math.max(...sessions.map((s) => s.startTime.getTime()))) : new Date();
  let startDate: Date;
  let endDate: Date;

  if (yearFilter === 'custom' && customRange) {
    startDate = new Date(`${customRange.startDate}T00:00:00`);
    endDate = new Date(`${customRange.endDate}T23:59:59`);
  } else if (yearFilter && ['2023', '2024', '2025', '2026'].includes(yearFilter)) {
    const y = parseInt(yearFilter, 10);
    startDate = new Date(y, 0, 1);
    endDate = new Date(y, 11, 31);
  } else {
    // 52 weeks back from latest date
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);
  }

  const dayMap = new Map<string, { count: number; volumeKg: number; durationMinutes: number; titles: string[] }>();
  sessions.forEach((s) => {
    const prev = dayMap.get(s.dateStr) || { count: 0, volumeKg: 0, durationMinutes: 0, titles: [] };
    prev.count += 1;
    prev.volumeKg += s.totalVolumeKg;
    prev.durationMinutes += s.durationMinutes;
    if (!prev.titles.includes(s.title)) prev.titles.push(s.title);
    dayMap.set(s.dateStr, prev);
  });

  const matrix: (HeatmapDay | null)[][] = [];
  let currentWeek: (HeatmapDay | null)[] = [];
  let totalActiveDays = 0;

  const startDayOfWeek = startDate.getDay(); // 0 is Sunday
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const info = dayMap.get(dateStr);
    const dayObj: HeatmapDay = {
      dateStr,
      date: new Date(cursor),
      count: info ? info.count : 0,
      volumeKg: info ? info.volumeKg : 0,
      durationMinutes: info ? info.durationMinutes : 0,
      sessionTitles: info ? info.titles : [],
    };

    if (dayObj.count > 0) totalActiveDays++;
    currentWeek.push(dayObj);

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    matrix.push(currentWeek);
  }

  return { matrix, totalActiveDays };
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  sets: number;
  volumeKg: number;
  percentage: number;
}

export interface MovementSplit {
  movementType: MovementType;
  sets: number;
  volumeKg: number;
  percentage: number;
}

export function computeMuscleDistribution(sets: WorkoutSet[]): {
  muscles: MuscleGroupVolume[];
  movements: MovementSplit[];
  radarData: { subject: string; sets: number; fullMark: number }[];
} {
  const muscleMap = new Map<MuscleGroup, { sets: number; volumeKg: number }>();
  const movementMap = new Map<MovementType, { sets: number; volumeKg: number }>();

  let totalWorkingSets = 0;

  sets.forEach((set) => {
    const m = set.muscleGroup;
    const curM = muscleMap.get(m) || { sets: 0, volumeKg: 0 };
    curM.sets += 1;
    curM.volumeKg += set.volumeKg;
    muscleMap.set(m, curM);

    const mov = set.movementType;
    const curMov = movementMap.get(mov) || { sets: 0, volumeKg: 0 };
    curMov.sets += 1;
    curMov.volumeKg += set.volumeKg;
    movementMap.set(mov, curMov);

    totalWorkingSets += 1;
  });

  const muscles: MuscleGroupVolume[] = Array.from(muscleMap.entries())
    .map(([muscleGroup, val]) => ({
      muscleGroup,
      sets: val.sets,
      volumeKg: Math.round(val.volumeKg),
      percentage: totalWorkingSets > 0 ? Number(((val.sets / totalWorkingSets) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.sets - a.sets);

  const movements: MovementSplit[] = Array.from(movementMap.entries())
    .map(([movementType, val]) => ({
      movementType,
      sets: val.sets,
      volumeKg: Math.round(val.volumeKg),
      percentage: totalWorkingSets > 0 ? Number(((val.sets / totalWorkingSets) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.sets - a.sets);

  const maxSets = muscles.length > 0 ? Math.max(...muscles.map((m) => m.sets)) : 100;
  const radarData = muscles
    .filter((m) => m.muscleGroup !== 'Other' && m.muscleGroup !== 'Cardio')
    .slice(0, 8)
    .map((m) => ({
      subject: m.muscleGroup,
      sets: m.sets,
      fullMark: Math.ceil(maxSets * 1.1),
    }));

  return { muscles, movements, radarData };
}

export function computeExercisePRs(sets: WorkoutSet[]): Map<string, PersonalRecord> {
  const prMap = new Map<string, PersonalRecord>();

  const exerciseSetsMap = new Map<string, WorkoutSet[]>();
  sets.forEach((set) => {
    const name = set.normalizedExercise;
    if (!exerciseSetsMap.has(name)) {
      exerciseSetsMap.set(name, []);
    }
    exerciseSetsMap.get(name)!.push(set);
  });

  exerciseSetsMap.forEach((eSets, exerciseTitle) => {
    eSets.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let maxWeight = 0;
    let maxWeightDate = eSets[0].startTime;
    let maxWeightReps = 0;

    let best1RM = 0;
    let best1RMDate = eSets[0].startTime;
    let best1RMWeight = 0;
    let best1RMReps = 0;

    const sessionVolumeMap = new Map<string, { volume: number; date: Date }>();
    eSets.forEach((s) => {
      const sKey = `${s.workoutTitle}_${s.startTime.getTime()}`;
      const prev = sessionVolumeMap.get(sKey) || { volume: 0, date: s.startTime };
      prev.volume += s.volumeKg;
      sessionVolumeMap.set(sKey, prev);

      if (s.weightKg > maxWeight) {
        maxWeight = s.weightKg;
        maxWeightDate = s.startTime;
        maxWeightReps = s.reps;
      }

      if (s.estimated1RM > best1RM) {
        best1RM = s.estimated1RM;
        best1RMDate = s.startTime;
        best1RMWeight = s.weightKg;
        best1RMReps = s.reps;
      }
    });

    let bestVolumeInSession = 0;
    let bestVolumeDate = eSets[0].startTime;
    sessionVolumeMap.forEach((v) => {
      if (v.volume > bestVolumeInSession) {
        bestVolumeInSession = v.volume;
        bestVolumeDate = v.date;
      }
    });

    const earliestNonZero = eSets.find((s) => s.weightKg > 0);
    const latestNonZero = [...eSets].reverse().find((s) => s.weightKg > 0);
    let progressPercent: number | undefined;
    if (earliestNonZero && latestNonZero && earliestNonZero.weightKg > 0) {
      progressPercent = Number(
        (((latestNonZero.weightKg - earliestNonZero.weightKg) / earliestNonZero.weightKg) * 100).toFixed(1)
      );
    }

    prMap.set(exerciseTitle, {
      exerciseTitle,
      maxWeight,
      maxWeightDate,
      maxWeightReps,
      best1RM,
      best1RMDate,
      best1RMWeight,
      best1RMReps,
      bestVolumeInSession,
      bestVolumeDate,
      recentWeight: latestNonZero?.weightKg,
      progressPercent,
    });
  });

  return prMap;
}

export interface ExerciseTimelinePoint {
  dateStr: string;
  date: Date;
  workoutTitle: string;
  maxWeight: number;
  estimated1RM: number;
  totalVolume: number;
  totalReps: number;
  workingSets: number;
  rpe?: number;
  notes: string;
}

export function getExerciseProgression(
  exerciseName: string,
  sets: WorkoutSet[]
): ExerciseTimelinePoint[] {
  const matchingSets = sets.filter((s) => s.normalizedExercise === exerciseName);
  if (matchingSets.length === 0) return [];

  const sessionPoints = new Map<string, ExerciseTimelinePoint>();

  matchingSets.forEach((s) => {
    const key = `${s.dateStr}_${s.workoutTitle}`;
    if (!sessionPoints.has(key)) {
      sessionPoints.set(key, {
        dateStr: s.dateStr,
        date: s.startTime,
        workoutTitle: s.workoutTitle,
        maxWeight: 0,
        estimated1RM: 0,
        totalVolume: 0,
        totalReps: 0,
        workingSets: 0,
        notes: '',
      });
    }

    const pt = sessionPoints.get(key)!;
    if (s.weightKg > pt.maxWeight) pt.maxWeight = s.weightKg;
    if (s.estimated1RM > pt.estimated1RM) pt.estimated1RM = s.estimated1RM;
    pt.totalVolume += s.volumeKg;
    pt.totalReps += s.reps;
    pt.workingSets += 1;
    if (s.rpe && (!pt.rpe || s.rpe > pt.rpe)) pt.rpe = s.rpe;
    if (s.exerciseNotes && !pt.notes.includes(s.exerciseNotes)) {
      pt.notes = pt.notes ? `${pt.notes}; ${s.exerciseNotes}` : s.exerciseNotes;
    }
  });

  return Array.from(sessionPoints.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface MonthlyBreakdown {
  monthKey: string; // YYYY-MM
  workoutsCount: number;
  volumeKg: number;
  avgDuration: number;
}

export function computeMonthlyBreakdowns(sessions: WorkoutSession[]): MonthlyBreakdown[] {
  const map = new Map<string, { count: number; volume: number; totalDuration: number }>();

  sessions.forEach((s) => {
    const ym = `${s.startTime.getFullYear()}-${String(s.startTime.getMonth() + 1).padStart(2, '0')}`;
    const cur = map.get(ym) || { count: 0, volume: 0, totalDuration: 0 };
    cur.count += 1;
    cur.volume += s.totalVolumeKg;
    cur.totalDuration += s.durationMinutes;
    map.set(ym, cur);
  });

  return Array.from(map.entries())
    .map(([monthKey, val]) => ({
      monthKey,
      workoutsCount: val.count,
      volumeKg: Math.round(val.volume),
      avgDuration: val.count > 0 ? Math.round(val.totalDuration / val.count) : 0,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
