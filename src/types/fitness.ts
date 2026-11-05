export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Core'
  | 'Forearms'
  | 'Cardio'
  | 'Other';

export type MovementType = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Arms' | 'Cardio';

export interface RawWorkoutRow {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  exercise_title: string;
  superset_id: string;
  exercise_notes: string;
  set_index: string;
  set_type: string;
  weight_kg: string;
  reps: string;
  distance_km: string;
  duration_seconds: string;
  rpe: string;
}

export interface WorkoutSet {
  id: string;
  workoutTitle: string;
  startTime: Date;
  endTime: Date;
  dateStr: string; // YYYY-MM-DD
  durationMinutes: number;
  exerciseTitle: string;
  normalizedExercise: string;
  muscleGroup: MuscleGroup;
  secondaryMuscleGroup?: MuscleGroup;
  movementType: MovementType;
  setIndex: number;
  setType: 'warmup' | 'normal' | 'failure';
  weightKg: number;
  reps: number;
  volumeKg: number;
  estimated1RM: number;
  rpe?: number;
  exerciseNotes: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  dateStr: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  workingSets: number;
  exercises: string[];
  sets: WorkoutSet[];
}

export interface PersonalRecord {
  exerciseTitle: string;
  maxWeight: number;
  maxWeightDate: Date;
  maxWeightReps: number;
  best1RM: number;
  best1RMDate: Date;
  best1RMWeight: number;
  best1RMReps: number;
  bestVolumeInSession: number;
  bestVolumeDate: Date;
  recentWeight?: number;
  progressPercent?: number;
}

export interface RawMeasurementRow {
  date: string;
  weight_kg: string;
  fat_percent: string;
  neck_cm: string;
  shoulder_cm: string;
  chest_cm: string;
  left_bicep_cm: string;
  right_bicep_cm: string;
  left_forearm_cm: string;
  right_forearm_cm: string;
  abdomen_cm: string;
  waist_cm: string;
  hips_cm: string;
  left_thigh_cm: string;
  right_thigh_cm: string;
  left_calf_cm: string;
  right_calf_cm: string;
}

export interface BodyMeasurement {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  weightKg?: number;
  fatPercent?: number;
  leanMassKg?: number;
  fatMassKg?: number;
  neckCm?: number;
  shoulderCm?: number;
  chestCm?: number;
  leftBicepCm?: number;
  rightBicepCm?: number;
  leftForearmCm?: number;
  rightForearmCm?: number;
  abdomenCm?: number;
  waistCm?: number;
  hipsCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  leftCalfCm?: number;
  rightCalfCm?: number;
  vTaperShoulderWaist?: number;
  vTaperChestWaist?: number;
  bicepDiff?: number;
  forearmDiff?: number;
  thighDiff?: number;
  calfDiff?: number;
}

export type TimeFilter = 'all' | '2026' | '2025' | '2024' | '2023' | '90d' | '30d' | 'custom';

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}


