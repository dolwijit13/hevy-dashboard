import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WorkoutSet,
  WorkoutSession,
  BodyMeasurement,
} from '../types/fitness';
import { normalizeExerciseName } from '../config/exerciseAliases';
import { getExerciseMetadata } from '../config/exerciseMuscleMap';
import {
  parseWorkoutCsv,
  parseMeasurementCsv,
  fetchDefaultWorkoutCsv,
  fetchDefaultMeasurementCsv,
  formatDateToYYYYMMDD,
} from './csvLoader';

export async function fetchWorkoutData(): Promise<{
  sets: WorkoutSet[];
  sessions: WorkoutSession[];
  source: 'supabase' | 'csv';
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch workouts list for title & duration lookup
      const { data: workoutsData, error: wError } = await supabase
        .from('workouts')
        .select('id, title, start_time, end_time, description')
        .order('start_time', { ascending: false });

      if (wError) throw wError;

      const workoutLookup = new Map<string, any>();
      (workoutsData || []).forEach((w) => workoutLookup.set(w.id, w));

      // 2. Fetch all sets using parallel paging
      const PAGE_SIZE = 1000;
      const { count } = await supabase
        .from('workout_sets')
        .select('*', { count: 'exact', head: true });

      const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
      const batchPromises = [];

      for (let i = 0; i < totalPages; i++) {
        const from = i * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        batchPromises.push(
          supabase
            .from('workout_sets')
            .select(
              'id, workout_id, exercise_title, superset_id, exercise_notes, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, start_time'
            )
            .order('start_time', { ascending: false })
            .range(from, to)
            .then((res) => {
              if (res.error) throw res.error;
              return res.data || [];
            })
        );
      }

      const results = await Promise.all(batchPromises);
      const rawSets = results.flat();

      if (rawSets.length > 0) {
        const sets: WorkoutSet[] = [];
        const sessionMap = new Map<string, WorkoutSession>();

        rawSets.forEach((row, index) => {
          const workout = workoutLookup.get(row.workout_id) || {};
          const startTime = new Date(row.start_time);
          const endTime = workout.end_time ? new Date(workout.end_time) : startTime;
          const durationMinutes = Math.max(
            1,
            Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
          );
          const dateStr = formatDateToYYYYMMDD(startTime);

          const weightKg = Number(row.weight_kg) || 0;
          const reps = Number(row.reps) || 0;
          const volumeKg = weightKg * reps;

          let estimated1RM = 0;
          if (weightKg > 0 && reps > 0) {
            estimated1RM = reps === 1 ? weightKg : Number((weightKg * (1 + reps / 30)).toFixed(1));
          }

          const normalizedExercise = normalizeExerciseName(row.exercise_title);
          const meta = getExerciseMetadata(normalizedExercise);

          const rawSetType = (row.set_type || 'normal').toLowerCase();
          const setType: 'warmup' | 'normal' | 'failure' =
            rawSetType === 'warmup' ? 'warmup' : rawSetType === 'failure' ? 'failure' : 'normal';

          const workoutTitle = workout.title || 'Workout';

          const setObj: WorkoutSet = {
            id: row.id || `set-${index}-${startTime.getTime()}`,
            workoutTitle,
            startTime,
            endTime,
            dateStr,
            durationMinutes,
            exerciseTitle: row.exercise_title,
            normalizedExercise,
            muscleGroup: meta.muscleGroup,
            secondaryMuscleGroup: meta.secondaryMuscleGroup,
            movementType: meta.movementType,
            setIndex: Number(row.set_index) || 0,
            setType,
            weightKg,
            reps,
            volumeKg,
            estimated1RM,
            rpe: row.rpe ? Number(row.rpe) : undefined,
            exerciseNotes: row.exercise_notes || '',
          };

          sets.push(setObj);

          // Group into sessions
          const sessionKey = row.workout_id || `${workoutTitle}_${startTime.getTime()}`;
          if (!sessionMap.has(sessionKey)) {
            sessionMap.set(sessionKey, {
              id: sessionKey,
              title: workoutTitle,
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

        return { sets, sessions, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase workout fetch failed, falling back to CSV:', err);
    }
  }

  // Fallback to local /raw/workout_data.csv
  const csvText = await fetchDefaultWorkoutCsv();
  const parsed = parseWorkoutCsv(csvText);
  return { ...parsed, source: 'csv' };
}

export async function fetchMeasurementData(): Promise<{
  measurements: BodyMeasurement[];
  source: 'supabase' | 'csv';
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const measurements: BodyMeasurement[] = data.map((row) => {
          const date = new Date(row.date);
          const dateStr = row.date;

          const num = (v: any) =>
            v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : undefined;

          const weightKg = num(row.weight_kg);
          const fatPercent = num(row.fat_percent);
          const neckCm = num(row.neck_cm);
          const shoulderCm = num(row.shoulder_cm);
          const chestCm = num(row.chest_cm);
          const leftBicepCm = num(row.left_bicep_cm);
          const rightBicepCm = num(row.right_bicep_cm);
          const leftForearmCm = num(row.left_forearm_cm);
          const rightForearmCm = num(row.right_forearm_cm);
          const abdomenCm = num(row.abdomen_cm);
          const waistCm = num(row.waist_cm);
          const hipsCm = num(row.hips_cm);
          const leftThighCm = num(row.left_thigh_cm);
          const rightThighCm = num(row.right_thigh_cm);
          const leftCalfCm = num(row.left_calf_cm);
          const rightCalfCm = num(row.right_calf_cm);

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

          const diff = (a?: number, b?: number) =>
            a !== undefined && b !== undefined ? Number(Math.abs(a - b).toFixed(2)) : undefined;

          return {
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
            bicepDiff: diff(leftBicepCm, rightBicepCm),
            forearmDiff: diff(leftForearmCm, rightForearmCm),
            thighDiff: diff(leftThighCm, rightThighCm),
            calfDiff: diff(leftCalfCm, rightCalfCm),
          };
        });

        return { measurements, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase measurements fetch failed, falling back to CSV:', err);
    }
  }

  // Fallback to local /raw/measurement_data.csv
  const csvText = await fetchDefaultMeasurementCsv();
  const measurements = parseMeasurementCsv(csvText);
  return { measurements, source: 'csv' };
}

