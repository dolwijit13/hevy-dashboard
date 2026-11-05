-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Workout',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_start_time ON workouts(start_time DESC);

-- 2. Workout Sets Table
CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_title TEXT NOT NULL,
  superset_id TEXT,
  exercise_notes TEXT,
  set_index INT NOT NULL DEFAULT 0,
  set_type TEXT NOT NULL DEFAULT 'normal',
  weight_kg NUMERIC,
  reps INT,
  distance_km NUMERIC,
  duration_seconds INT,
  rpe NUMERIC,
  start_time TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_sets_start_time ON workout_sets(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_title);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);

-- 3. Body Measurements Table
CREATE TABLE IF NOT EXISTS body_measurements (
  date DATE PRIMARY KEY,
  weight_kg NUMERIC,
  fat_percent NUMERIC,
  neck_cm NUMERIC,
  shoulder_cm NUMERIC,
  chest_cm NUMERIC,
  left_bicep_cm NUMERIC,
  right_bicep_cm NUMERIC,
  left_forearm_cm NUMERIC,
  right_forearm_cm NUMERIC,
  abdomen_cm NUMERIC,
  waist_cm NUMERIC,
  hips_cm NUMERIC,
  left_thigh_cm NUMERIC,
  right_thigh_cm NUMERIC,
  left_calf_cm NUMERIC,
  right_calf_cm NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_measurements_date ON body_measurements(date ASC);

-- 4. Enable Row Level Security (RLS) & Grant Public Read
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated users to read data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Allow public read access on workouts'
  ) THEN
    CREATE POLICY "Allow public read access on workouts" ON workouts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_sets' AND policyname = 'Allow public read access on workout_sets'
  ) THEN
    CREATE POLICY "Allow public read access on workout_sets" ON workout_sets FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'body_measurements' AND policyname = 'Allow public read access on body_measurements'
  ) THEN
    CREATE POLICY "Allow public read access on body_measurements" ON body_measurements FOR SELECT USING (true);
  END IF;
END
$$;

