import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Client } from 'pg';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SyncResult {
  success: boolean;
  updated: boolean;
  newWorkoutsCount: number;
  newRowsCount: number;
  latestWorkout?: {
    title: string;
    startTime: string;
  };
  message: string;
  error?: string;
}

export interface SyncStatus {
  configured: boolean;
  hasKey: boolean;
  latestDateInCsv: string | null;
  totalWorkoutsInCsv: number;
  totalSetsInCsv: number;
}

export function formatHevyDate(isoStr: string | Date): string {
  const d = typeof isoStr === 'string' ? new Date(isoStr) : isoStr;
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

export function parseFlexibleDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const cleaned = dateStr.replace(',', '').trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
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

export function saveApiKeyToEnvLocal(apiKey: string): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  if (content.match(/^HEVY_API_KEY\s*=/m)) {
    content = content.replace(/^HEVY_API_KEY\s*=.*$/m, `HEVY_API_KEY=${apiKey}`);
  } else {
    content = (content.trim() ? content.trim() + '\n' : '') + `HEVY_API_KEY=${apiKey}\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

export function getHevyApiKey(overrideKey?: string): string | null {
  if (overrideKey && overrideKey.trim()) {
    saveApiKeyToEnvLocal(overrideKey.trim());
    return overrideKey.trim();
  }
  if (process.env.HEVY_API_KEY && process.env.HEVY_API_KEY.trim()) {
    return process.env.HEVY_API_KEY.trim();
  }

  // Try reading .env.local
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^HEVY_API_KEY\s*=\s*(.*)$/m);
    if (match && match[1]) {
      const k = match[1].trim().replace(/^["']|["']$/g, '');
      if (k) return k;
    }
  }

  // Try reading .env
  const mainEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(mainEnvPath)) {
    const content = fs.readFileSync(mainEnvPath, 'utf8');
    const match = content.match(/^HEVY_API_KEY\s*=\s*(.*)$/m);
    if (match && match[1]) {
      const k = match[1].trim().replace(/^["']|["']$/g, '');
      if (k) return k;
    }
  }

  return null;
}

export function getPostgresConnString(): string | null {
  if (process.env.SUPABASE_POSTGRES_CONNECTION_STRING && process.env.SUPABASE_POSTGRES_CONNECTION_STRING.trim()) {
    return process.env.SUPABASE_POSTGRES_CONNECTION_STRING.trim();
  }
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^SUPABASE_POSTGRES_CONNECTION_STRING\s*=\s*(.*)$/m);
    if (match && match[1]) {
      const k = match[1].trim().replace(/^["']|["']$/g, '');
      if (k) return k;
    }
  }
  return null;
}

export async function upsertWorkoutsToSupabase(newWorkouts: any[]): Promise<void> {
  const connStr = getPostgresConnString();
  if (!connStr) return;

  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const w of newWorkouts) {
      const startTime = new Date(w.start_time);
      const endTime = w.end_time ? new Date(w.end_time) : startTime;
      const workoutId = `w_${startTime.getTime()}_${(w.title || 'Workout').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}`;

      await client.query(
        `
        INSERT INTO workouts (id, title, start_time, end_time, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          description = EXCLUDED.description;
      `,
        [workoutId, w.title || 'Workout', startTime.toISOString(), endTime.toISOString(), w.description || '']
      );

      let setIdx = 0;
      for (const ex of (w.exercises || [])) {
        for (const s of (ex.sets || [])) {
          const setId = `set_${workoutId}_${setIdx++}`;
          const distKm =
            s.distance_meters !== null && s.distance_meters !== undefined
              ? Number((s.distance_meters / 1000).toFixed(3))
              : null;

          await client.query(
            `
            INSERT INTO workout_sets (
              id, workout_id, exercise_title, superset_id, exercise_notes,
              set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe, start_time
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              exercise_title = EXCLUDED.exercise_title,
              weight_kg = EXCLUDED.weight_kg,
              reps = EXCLUDED.reps,
              set_type = EXCLUDED.set_type;
          `,
            [
              setId,
              workoutId,
              ex.title || '',
              ex.superset_id ?? null,
              ex.notes || '',
              s.index ?? 0,
              (s.type || 'normal').toLowerCase(),
              s.weight_kg ?? null,
              s.reps ?? null,
              distKm,
              s.duration_seconds ?? null,
              s.rpe ?? null,
              startTime.toISOString(),
            ]
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to upsert to Supabase in hevySync:', err);
  } finally {
    await client.end();
  }
}

export function getSyncStatus(csvDir = 'raw'): SyncStatus {
  const apiKey = getHevyApiKey();
  const csvPath = path.resolve(process.cwd(), csvDir, 'workout_data.csv');

  if (!fs.existsSync(csvPath)) {
    return {
      configured: Boolean(apiKey),
      hasKey: Boolean(apiKey),
      latestDateInCsv: null,
      totalWorkoutsInCsv: 0,
      totalSetsInCsv: 0,
    };
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse<{ start_time?: string; title?: string }>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const sessionKeys = new Set<string>();
  let latestTimestamp = 0;
  let latestDateStr: string | null = null;

  for (const row of parsed.data) {
    if (row.start_time) {
      const timeKey = `${row.title || ''}_${row.start_time}`;
      sessionKeys.add(timeKey);

      const d = parseFlexibleDate(row.start_time);
      const t = d.getTime();
      if (t > latestTimestamp) {
        latestTimestamp = t;
        latestDateStr = row.start_time;
      }
    }
  }

  return {
    configured: Boolean(apiKey),
    hasKey: Boolean(apiKey),
    latestDateInCsv: latestDateStr,
    totalWorkoutsInCsv: sessionKeys.size,
    totalSetsInCsv: parsed.data.length,
  };
}

export async function syncHevyWorkouts(options?: {
  overrideApiKey?: string;
  csvDir?: string;
}): Promise<SyncResult> {
  const csvDir = options?.csvDir || 'raw';
  const apiKey = getHevyApiKey(options?.overrideApiKey);

  if (!apiKey) {
    return {
      success: false,
      updated: false,
      newWorkoutsCount: 0,
      newRowsCount: 0,
      message: 'ไม่พบ HEVY_API_KEY กรุณาระบุในไฟล์ .env.local หรือส่งผ่านการตั้งค่า',
      error: 'NO_API_KEY',
    };
  }

  const csvPath = path.resolve(process.cwd(), csvDir, 'workout_data.csv');
  const backupPath = path.resolve(process.cwd(), csvDir, 'workout_data.backup.csv');

  let existingContent = '';
  let latestTimestamp = 0;
  const existingWorkoutKeys = new Set<string>();

  if (fs.existsSync(csvPath)) {
    existingContent = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse<{ start_time?: string; title?: string }>(existingContent, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      if (row.start_time) {
        const d = parseFlexibleDate(row.start_time);
        const t = d.getTime();
        if (t > latestTimestamp) {
          latestTimestamp = t;
        }
        // Key to deduplicate workouts: normalized start time string + title
        existingWorkoutKeys.add(`${formatHevyDate(d)}|${(row.title || '').trim()}`);
      }
    }
  }

  // Fetch from Hevy API paginated until reaching already-known workouts
  const newWorkouts: any[] = [];
  let page = 1;
  const pageSize = 10;
  let reachedExisting = false;
  const maxPages = 40; // up to 400 workouts safety limit

  while (!reachedExisting && page <= maxPages) {
    let res: Response;
    try {
      res = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`, {
        headers: {
          'api-key': apiKey,
          Accept: 'application/json',
        },
      });
    } catch (netErr: any) {
      return {
        success: false,
        updated: false,
        newWorkoutsCount: 0,
        newRowsCount: 0,
        message: `เชื่อมต่อ Hevy API ไม่สำเร็จ: ${netErr.message}`,
        error: 'NETWORK_ERROR',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        updated: false,
        newWorkoutsCount: 0,
        newRowsCount: 0,
        message: 'HEVY_API_KEY ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง (ต้องใช้ Hevy Pro)',
        error: 'UNAUTHORIZED',
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        updated: false,
        newWorkoutsCount: 0,
        newRowsCount: 0,
        message: `Hevy API แจ้งข้อผิดพลาด (${res.status}): ${errText}`,
        error: `HTTP_${res.status}`,
      };
    }

    const data = await res.json();
    const workouts = data.workouts || [];
    if (workouts.length === 0) {
      break;
    }

    for (const w of workouts) {
      const wDate = new Date(w.start_time);
      const wTimestamp = wDate.getTime();
      const wFormattedDate = formatHevyDate(wDate);
      const workoutKey = `${wFormattedDate}|${(w.title || '').trim()}`;

      // Check if this workout is newer than our latest CSV record and not already in CSV
      if (wTimestamp > latestTimestamp + 5000 && !existingWorkoutKeys.has(workoutKey)) {
        newWorkouts.push(w);
      } else {
        reachedExisting = true;
        break;
      }
    }

    if (reachedExisting || page >= data.page_count) {
      break;
    }
    page++;
  }

  if (newWorkouts.length === 0) {
    return {
      success: true,
      updated: false,
      newWorkoutsCount: 0,
      newRowsCount: 0,
      message: 'ข้อมูลเป็นปัจจุบันแล้ว ไม่มี workout ใหม่ที่ต้องอัปเดต',
    };
  }

  // Convert new workouts to CSV rows matching workout_data.csv format
  const generatedRows: any[] = [];

  for (const w of newWorkouts) {
    const startTimeStr = formatHevyDate(w.start_time);
    const endTimeStr = formatHevyDate(w.end_time || w.start_time);

    for (const ex of (w.exercises || [])) {
      for (const set of (ex.sets || [])) {
        const distKm =
          set.distance_meters !== null && set.distance_meters !== undefined
            ? Number((set.distance_meters / 1000).toFixed(3))
            : '';

        generatedRows.push({
          title: w.title || '',
          start_time: startTimeStr,
          end_time: endTimeStr,
          description: w.description || '',
          exercise_title: ex.title || '',
          superset_id: ex.superset_id !== null && ex.superset_id !== undefined ? ex.superset_id : '',
          exercise_notes: ex.notes || '',
          set_index: set.index ?? 0,
          set_type: (set.type || 'normal').toLowerCase(),
          weight_kg: set.weight_kg !== null && set.weight_kg !== undefined ? set.weight_kg : '',
          reps: set.reps !== null && set.reps !== undefined ? set.reps : '',
          distance_km: distKm,
          duration_seconds: set.duration_seconds !== null && set.duration_seconds !== undefined ? set.duration_seconds : '',
          rpe: set.rpe !== null && set.rpe !== undefined ? set.rpe : '',
        });
      }
    }
  }

  // Generate CSV text
  const newCsvLines = Papa.unparse(
    {
      fields: [
        'title',
        'start_time',
        'end_time',
        'description',
        'exercise_title',
        'superset_id',
        'exercise_notes',
        'set_index',
        'set_type',
        'weight_kg',
        'reps',
        'distance_km',
        'duration_seconds',
        'rpe',
      ],
      data: generatedRows,
    },
    {
      header: false,
      quotes: (_value, colIndex) => [0, 1, 2, 3, 4, 6, 8].includes(colIndex),
      newline: '\r\n',
    }
  );

  // Also upsert directly to Supabase if configured
  try {
    await upsertWorkoutsToSupabase(newWorkouts);
  } catch (dbErr) {
    console.warn('Failed to upsert to Supabase during sync:', dbErr);
  }

  // Backup existing file if present
  if (fs.existsSync(csvPath)) {
    fs.copyFileSync(csvPath, backupPath);
  }

  // Prepend new rows right after the header line
  let updatedCsv = '';
  if (existingContent && existingContent.includes('\n')) {
    const firstNewline = existingContent.indexOf('\n');
    const headerLine = existingContent.slice(0, firstNewline + 1); // includes \r\n or \n
    const remainingLines = existingContent.slice(firstNewline + 1);
    updatedCsv = `${headerLine}${newCsvLines}\r\n${remainingLines}`;
  } else {
    // Brand new file
    const header =
      '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"\r\n';
    updatedCsv = `${header}${newCsvLines}\r\n`;
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, updatedCsv, 'utf8');

  // Also update dist/raw/workout_data.csv if dist exists
  const distCsvPath = path.resolve(process.cwd(), 'dist', csvDir, 'workout_data.csv');
  if (fs.existsSync(path.dirname(distCsvPath))) {
    fs.writeFileSync(distCsvPath, updatedCsv, 'utf8');
  }

  return {
    success: true,
    updated: true,
    newWorkoutsCount: newWorkouts.length,
    newRowsCount: generatedRows.length,
    latestWorkout: {
      title: newWorkouts[0].title || 'Workout',
      startTime: formatHevyDate(newWorkouts[0].start_time),
    },
    message: `ซิงค์สำเร็จ! เพิ่ม ${newWorkouts.length} workout ใหม่ (${generatedRows.length} เซ็ต)`,
  };
}
