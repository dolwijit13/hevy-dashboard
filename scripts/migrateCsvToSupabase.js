import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import Papa from 'papaparse';

// Flexible date parser matching project rules
function parseFlexibleDate(dateStr) {
  if (!dateStr) return new Date(0);
  const cleaned = dateStr.replace(',', '').trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthMap = {
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
  return new Date(0);
}

function formatDateToYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function runMigration() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_POSTGRES_CONNECTION_STRING=(.*)/);
  if (!match) {
    throw new Error('Missing SUPABASE_POSTGRES_CONNECTION_STRING in .env.local');
  }
  const connStr = match[1].trim().replace(/^["']|["']$/g, '');

  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to PostgreSQL for data migration...');

  // 1. Migrate Workout Data
  const workoutCsvPath = path.resolve('raw', 'workout_data.csv');
  if (fs.existsSync(workoutCsvPath)) {
    console.log('Parsing workout_data.csv...');
    const workoutCsv = fs.readFileSync(workoutCsvPath, 'utf8');
    const parsedWorkouts = Papa.parse(workoutCsv, { header: true, skipEmptyLines: true });

    const workoutMap = new Map(); // workout_id -> workout
    const sets = [];

    parsedWorkouts.data.forEach((row, idx) => {
      if (!row.exercise_title || !row.start_time) return;

      const startTime = parseFlexibleDate(row.start_time);
      const endTime = row.end_time ? parseFlexibleDate(row.end_time) : startTime;
      const workoutId = `w_${startTime.getTime()}_${(row.title || 'Workout').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}`;

      if (!workoutMap.has(workoutId)) {
        workoutMap.set(workoutId, {
          id: workoutId,
          title: row.title || 'Workout',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          description: row.description || '',
        });
      }

      const setId = `set_${workoutId}_${idx}`;
      sets.push({
        id: setId,
        workout_id: workoutId,
        exercise_title: row.exercise_title,
        superset_id: row.superset_id || null,
        exercise_notes: row.exercise_notes || '',
        set_index: parseInt(row.set_index, 10) || 0,
        set_type: (row.set_type || 'normal').toLowerCase(),
        weight_kg: row.weight_kg !== '' && !isNaN(Number(row.weight_kg)) ? Number(row.weight_kg) : null,
        reps: row.reps !== '' && !isNaN(Number(row.reps)) ? parseInt(row.reps, 10) : null,
        distance_km: row.distance_km !== '' && !isNaN(Number(row.distance_km)) ? Number(row.distance_km) : null,
        duration_seconds: row.duration_seconds !== '' && !isNaN(Number(row.duration_seconds)) ? parseInt(row.duration_seconds, 10) : null,
        rpe: row.rpe !== '' && !isNaN(Number(row.rpe)) ? Number(row.rpe) : null,
        start_time: startTime.toISOString(),
      });
    });

    console.log(`Found ${workoutMap.size} workouts and ${sets.length} sets. Inserting...`);

    // Insert Workouts in batches
    const workoutsList = Array.from(workoutMap.values());
    const WORKOUT_BATCH = 200;
    for (let i = 0; i < workoutsList.length; i += WORKOUT_BATCH) {
      const batch = workoutsList.slice(i, i + WORKOUT_BATCH);
      const values = [];
      const placeholders = [];
      let pIdx = 1;

      for (const w of batch) {
        placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        values.push(w.id, w.title, w.start_time, w.end_time, w.description);
      }

      const query = `
        INSERT INTO workouts (id, title, start_time, end_time, description)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          description = EXCLUDED.description;
      `;
      await client.query(query, values);
    }
    console.log(`Inserted ${workoutsList.length} workouts!`);

    // Insert Sets in batches
    const SETS_BATCH = 400;
    for (let i = 0; i < sets.length; i += SETS_BATCH) {
      const batch = sets.slice(i, i + SETS_BATCH);
      const values = [];
      const placeholders = [];
      let pIdx = 1;

      for (const s of batch) {
        placeholders.push(
          `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`
        );
        values.push(
          s.id,
          s.workout_id,
          s.exercise_title,
          s.superset_id,
          s.exercise_notes,
          s.set_index,
          s.set_type,
          s.weight_kg,
          s.reps,
          s.distance_km,
          s.duration_seconds,
          s.rpe,
          s.start_time
        );
      }

      const query = `
        INSERT INTO workout_sets (
          id, workout_id, exercise_title, superset_id, exercise_notes,
          set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, start_time
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          exercise_title = EXCLUDED.exercise_title,
          weight_kg = EXCLUDED.weight_kg,
          reps = EXCLUDED.reps,
          set_type = EXCLUDED.set_type;
      `;
      await client.query(query, values);
    }
    console.log(`Inserted ${sets.length} workout sets!`);
  }

  // 2. Migrate Measurement Data
  const measurementCsvPath = path.resolve('raw', 'measurement_data.csv');
  if (fs.existsSync(measurementCsvPath)) {
    console.log('Parsing measurement_data.csv...');
    const mCsv = fs.readFileSync(measurementCsvPath, 'utf8');
    const parsedM = Papa.parse(mCsv, { header: true, skipEmptyLines: true });

    const num = (v) => (v && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null);
    const measurements = [];

    parsedM.data.forEach((row) => {
      if (!row.date) return;
      const d = parseFlexibleDate(row.date);
      const dateStr = formatDateToYYYYMMDD(d);

      measurements.push({
        date: dateStr,
        weight_kg: num(row.weight_kg),
        fat_percent: num(row.fat_percent),
        neck_cm: num(row.neck_cm),
        shoulder_cm: num(row.shoulder_cm),
        chest_cm: num(row.chest_cm),
        left_bicep_cm: num(row.left_bicep_cm),
        right_bicep_cm: num(row.right_bicep_cm),
        left_forearm_cm: num(row.left_forearm_cm),
        right_forearm_cm: num(row.right_forearm_cm),
        abdomen_cm: num(row.abdomen_cm),
        waist_cm: num(row.waist_cm),
        hips_cm: num(row.hips_cm),
        left_thigh_cm: num(row.left_thigh_cm),
        right_thigh_cm: num(row.right_thigh_cm),
        left_calf_cm: num(row.left_calf_cm),
        right_calf_cm: num(row.right_calf_cm),
      });
    });

    console.log(`Found ${measurements.length} measurements. Inserting...`);
    for (const m of measurements) {
      const query = `
        INSERT INTO body_measurements (
          date, weight_kg, fat_percent, neck_cm, shoulder_cm, chest_cm,
          left_bicep_cm, right_bicep_cm, left_forearm_cm, right_forearm_cm,
          abdomen_cm, waist_cm, hips_cm, left_thigh_cm, right_thigh_cm,
          left_calf_cm, right_calf_cm
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (date) DO UPDATE SET
          weight_kg = EXCLUDED.weight_kg,
          fat_percent = EXCLUDED.fat_percent,
          shoulder_cm = EXCLUDED.shoulder_cm,
          chest_cm = EXCLUDED.chest_cm,
          waist_cm = EXCLUDED.waist_cm;
      `;
      await client.query(query, [
        m.date,
        m.weight_kg,
        m.fat_percent,
        m.neck_cm,
        m.shoulder_cm,
        m.chest_cm,
        m.left_bicep_cm,
        m.right_bicep_cm,
        m.left_forearm_cm,
        m.right_forearm_cm,
        m.abdomen_cm,
        m.waist_cm,
        m.hips_cm,
        m.left_thigh_cm,
        m.right_thigh_cm,
        m.left_calf_cm,
        m.right_calf_cm,
      ]);
    }
    console.log(`Inserted ${measurements.length} measurements!`);
  }

  await client.end();
  console.log('✅ All data migrated to Supabase successfully!');
}

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

