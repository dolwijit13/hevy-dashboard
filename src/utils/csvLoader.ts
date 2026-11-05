import Papa from 'papaparse';
import {
  RawWorkoutRow,
  RawMeasurementRow,
  WorkoutSet,
  WorkoutSession,
  BodyMeasurement,
} from '../types/fitness';
import { normalizeExerciseName } from '../config/exerciseAliases';
import { getExerciseMetadata } from '../config/exerciseMuscleMap';

export function parseDateFlexible(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Standard format in Hevy: "14 Sep 2026, 20:15" or "27 Jan 2023, 00:00"
  const cleaned = dateStr.replace(',', '').trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  // Fallback: parse manually "14 Sep 2026 20:15"
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = monthMap[parts[1].toLowerCase().slice(0, 3)] ?? 0;
    const year = parseInt(parts[2], 10);
    let hours = 0;
    let minutes = 0;
    if (parts[3]) {
      const [h, m] = parts[3].split(':');
      hours = parseInt(h, 10) || 0;
      minutes = parseInt(m, 10) || 0;
    }
    return new Date(year, month, day, hours, minutes);
  }
  return new Date();
}

export function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseWorkoutCsv(csvText: string): { sets: WorkoutSet[]; sessions: WorkoutSession[] } {
  const result = Papa.parse<RawWorkoutRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rawRows = result.data;
  const sets: WorkoutSet[] = [];
  const sessionMap = new Map<string, WorkoutSession>();

  rawRows.forEach((row, index) => {
    if (!row.exercise_title || !row.start_time) return;

    const startTime = parseDateFlexible(row.start_time);
    const endTime = row.end_time ? parseDateFlexible(row.end_time) : startTime;
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)));
    const dateStr = formatDateToYYYYMMDD(startTime);

    const weightKg = parseFloat(row.weight_kg) || 0;
    const reps = parseInt(row.reps, 10) || 0;
    const volumeKg = weightKg * reps;

    // Epley Formula for 1RM: weight * (1 + reps / 30)
    // For reps === 1, estimated 1RM is exactly weight
    let estimated1RM = 0;
    if (weightKg > 0 && reps > 0) {
      estimated1RM = reps === 1 ? weightKg : Number((weightKg * (1 + reps / 30)).toFixed(1));
    }

    const normalizedExercise = normalizeExerciseName(row.exercise_title);
    const meta = getExerciseMetadata(normalizedExercise);

    const rawSetType = (row.set_type || 'normal').toLowerCase();
    const setType: 'warmup' | 'normal' | 'failure' =
      rawSetType === 'warmup' ? 'warmup' : rawSetType === 'failure' ? 'failure' : 'normal';

    const setObj: WorkoutSet = {
      id: `set-${index}-${startTime.getTime()}`,
      workoutTitle: row.title || 'Workout',
      startTime,
      endTime,
      dateStr,
      durationMinutes,
      exerciseTitle: row.exercise_title,
      normalizedExercise,
      muscleGroup: meta.muscleGroup,
      secondaryMuscleGroup: meta.secondaryMuscleGroup,
      movementType: meta.movementType,
      setIndex: parseInt(row.set_index, 10) || 0,
      setType,
      weightKg,
      reps,
      volumeKg,
      estimated1RM,
      rpe: row.rpe ? parseFloat(row.rpe) : undefined,
      exerciseNotes: row.exercise_notes || '',
    };

    sets.push(setObj);

    // Group into sessions: key by title + startTime timestamp
    const sessionKey = `${row.title}_${startTime.getTime()}`;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, {
        id: sessionKey,
        title: row.title || 'Workout',
        startTime,
        endTime,
        dateStr,
        durationMinutes,
        totalVolumeKg: 0,
        totalSets: 0,
        workingSets: 0,
        exercises: [],
        sets: [],
      });
    }

    const session = sessionMap.get(sessionKey)!;
    session.sets.push(setObj);
    session.totalSets += 1;
    if (setType !== 'warmup') {
      session.workingSets += 1;
      session.totalVolumeKg += volumeKg;
    }
    if (!session.exercises.includes(normalizedExercise)) {
      session.exercises.push(normalizedExercise);
    }
  });

  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime()
  );

  return { sets, sessions };
}

export function parseMeasurementCsv(csvText: string): BodyMeasurement[] {
  const result = Papa.parse<RawMeasurementRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const measurements: BodyMeasurement[] = [];

  result.data.forEach((row) => {
    if (!row.date) return;

    const parseNum = (val?: string) => (val && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : undefined);

    const weightKg = parseNum(row.weight_kg);
    const fatPercent = parseNum(row.fat_percent);
    const neckCm = parseNum(row.neck_cm);
    const shoulderCm = parseNum(row.shoulder_cm);
    const chestCm = parseNum(row.chest_cm);
    const leftBicepCm = parseNum(row.left_bicep_cm);
    const rightBicepCm = parseNum(row.right_bicep_cm);
    const leftForearmCm = parseNum(row.left_forearm_cm);
    const rightForearmCm = parseNum(row.right_forearm_cm);
    const abdomenCm = parseNum(row.abdomen_cm);
    const waistCm = parseNum(row.waist_cm);
    const hipsCm = parseNum(row.hips_cm);
    const leftThighCm = parseNum(row.left_thigh_cm);
    const rightThighCm = parseNum(row.right_thigh_cm);
    const leftCalfCm = parseNum(row.left_calf_cm);
    const rightCalfCm = parseNum(row.right_calf_cm);

    // Skip rows where all measurements are empty
    const hasAnyMetric =
      weightKg !== undefined ||
      fatPercent !== undefined ||
      shoulderCm !== undefined ||
      chestCm !== undefined ||
      waistCm !== undefined ||
      leftBicepCm !== undefined ||
      leftThighCm !== undefined;

    if (!hasAnyMetric) return;

    const date = parseDateFlexible(row.date);
    const dateStr = formatDateToYYYYMMDD(date);

    let leanMassKg: number | undefined;
    let fatMassKg: number | undefined;
    if (weightKg !== undefined && fatPercent !== undefined) {
      fatMassKg = Number(((weightKg * fatPercent) / 100).toFixed(2));
      leanMassKg = Number((weightKg - fatMassKg).toFixed(2));
    }

    const vTaperShoulderWaist =
      shoulderCm && waistCm ? Number((shoulderCm / waistCm).toFixed(3)) : undefined;
    const vTaperChestWaist =
      chestCm && waistCm ? Number((chestCm / waistCm).toFixed(3)) : undefined;

    const bicepDiff =
      rightBicepCm !== undefined && leftBicepCm !== undefined
        ? Number((rightBicepCm - leftBicepCm).toFixed(2))
        : undefined;
    const forearmDiff =
      rightForearmCm !== undefined && leftForearmCm !== undefined
        ? Number((rightForearmCm - leftForearmCm).toFixed(2))
        : undefined;
    const thighDiff =
      rightThighCm !== undefined && leftThighCm !== undefined
        ? Number((rightThighCm - leftThighCm).toFixed(2))
        : undefined;
    const calfDiff =
      rightCalfCm !== undefined && leftCalfCm !== undefined
        ? Number((rightCalfCm - leftCalfCm).toFixed(2))
        : undefined;

    measurements.push({
      date,
      dateStr,
      weightKg,
      fatPercent,
      leanMassKg,
      fatMassKg,
      neckCm,
      shoulderCm,
      chestCm,
      leftBicepCm,
      rightBicepCm,
      leftForearmCm,
      rightForearmCm,
      abdomenCm,
      waistCm,
      hipsCm,
      leftThighCm,
      rightThighCm,
      leftCalfCm,
      rightCalfCm,
      vTaperShoulderWaist,
      vTaperChestWaist,
      bicepDiff,
      forearmDiff,
      thighDiff,
      calfDiff,
    });
  });

  return measurements.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function fetchDefaultWorkoutCsv(): Promise<string> {
  const res = await fetch(`/raw/workout_data.csv?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /raw/workout_data.csv: ${res.statusText}`);
  }
  return await res.text();
}

export async function fetchDefaultMeasurementCsv(): Promise<string> {
  const res = await fetch(`/raw/measurement_data.csv?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /raw/measurement_data.csv: ${res.statusText}`);
  }
  return await res.text();
}

