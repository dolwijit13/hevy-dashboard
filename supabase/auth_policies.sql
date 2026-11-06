-- ==============================================================================
-- Supabase RLS Migration: Restrict Access to Authenticated Users
-- Run this in Supabase Console -> SQL Editor
-- ==============================================================================

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- 2. Remove old public read policies
DROP POLICY IF EXISTS "Allow public read access on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow public read access on workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "Allow public read access on body_measurements" ON body_measurements;

DROP POLICY IF EXISTS "Allow authenticated read on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow authenticated read on workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "Allow authenticated read on body_measurements" ON body_measurements;

DROP POLICY IF EXISTS "Allow authenticated full access on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow authenticated full access on workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "Allow authenticated full access on body_measurements" ON body_measurements;

-- 3. Create Authenticated-only policies (Read & Write)
-- This blocks anonymous / unauthenticated public requests from querying your data.
CREATE POLICY "Allow authenticated full access on workouts"
  ON workouts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on workout_sets"
  ON workout_sets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on body_measurements"
  ON body_measurements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: Supabase service_role key automatically bypasses RLS for server-side operations.

