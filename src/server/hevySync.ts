import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  details?: any;
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
  try {
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
  } catch (err) {
    // Read-only filesystem on serverless environments
  }
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
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^HEVY_API_KEY\s*=\s*(.*)$/m);
      if (match && match[1]) {
        const k = match[1].trim().replace(/^["']|["']$/g, '');
        if (k) return k;
      }
    }
  } catch (_) {}

  // Try reading .env
  try {
    const mainEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(mainEnvPath)) {
      const content = fs.readFileSync(mainEnvPath, 'utf8');
      const match = content.match(/^HEVY_API_KEY\s*=\s*(.*)$/m);
      if (match && match[1]) {
        const k = match[1].trim().replace(/^["']|["']$/g, '');
        if (k) return k;
      }
    }
  } catch (_) {}

  return null;
}

export function getSupabaseServerClient(): SupabaseClient | null {
  const url =
    process.env.SUPABASE_PROJECT_URL ||
    process.env.VITE_SUPABASE_PROJECT_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getSyncStatus(csvDir = 'raw'): Promise<SyncStatus> {
  const apiKey = getHevyApiKey();
  const supabase = getSupabaseServerClient();

  // 1. Try Supabase first
  if (supabase) {
    try {
      const [wCountRes, sCountRes, latestRes] = await Promise.all([
        supabase.from('workouts').select('*', { count: 'exact', head: true }),
        supabase.from('workout_sets').select('*', { count: 'exact', head: true }),
        supabase.from('workouts').select('start_time').order('start_time', { ascending: false }).limit(1),
      ]);

      const latestDateStr = latestRes.data?.[0]?.start_time
        ? formatHevyDate(latestRes.data[0].start_time)
        : null;

      return {
        configured: Boolean(apiKey),
        hasKey: Boolean(apiKey),
        latestDateInCsv: latestDateStr,
        totalWorkoutsInCsv: wCountRes.count || 0,
        totalSetsInCsv: sCountRes.count || 0,
      };
    } catch (err) {
      console.warn('Failed to query Supabase status, falling back to CSV:', err);
    }
  }

  // 2. Fallback to local CSV
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
      message: 'ไม่พบ HEVY_API_KEY กรุณาระบุใน Environment Variables ของ Vercel หรือ .env.local',
      error: 'NO_API_KEY',
    };
  }

  const supabase = getSupabaseServerClient();
  let latestTimestamp = 0;
  const existingWorkoutKeys = new Set<string>();

  // 1. Check Supabase first for latest workout timestamp & existing keys
  if (supabase) {
    try {
      const { data: latestRows, error } = await supabase
        .from('workouts')
        .select('start_time, title')
        .order('start_time', { ascending: false })
        .limit(20);

      if (!error && latestRows && latestRows.length > 0) {
        latestTimestamp = new Date(latestRows[0].start_time).getTime();
        for (const r of latestRows) {
          existingWorkoutKeys.add(`${formatHevyDate(r.start_time)}|${(r.title || '').trim()}`);
        }
      }
    } catch (e) {
      console.warn('Could not query latest workout from Supabase:', e);
    }
  }

  // 2. Also check local CSV if present
  const csvPath = path.resolve(process.cwd(), csvDir, 'workout_data.csv');
  let existingContent = '';
  if (fs.existsSync(csvPath)) {
    try {
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
          existingWorkoutKeys.add(`${formatHevyDate(d)}|${(row.title || '').trim()}`);
        }
      }
    } catch (_) {}
  }

  // 3. Fetch from Hevy API paginated until reaching already-known workouts
  const newWorkouts: any[] = [];
  let page = 1;
  const pageSize = 10;
  let reachedExisting = false;
  const maxPages = 20;

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

      // If workout is strictly newer than our latest record (tolerance 5s) and not in existing keys
      if (latestTimestamp === 0 || (wTimestamp > latestTimestamp + 5000 && !existingWorkoutKeys.has(workoutKey))) {
        newWorkouts.push(w);
      } else {
        reachedExisting = true;
        break;
      }
    }

    if (reachedExisting || page >= (data.page_count || 1)) {
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

  // 4. Map new workouts to DB and CSV structures
  const supabaseWorkouts: any[] = [];
  const supabaseSets: any[] = [];
  const generatedCsvRows: any[] = [];

  for (const w of newWorkouts) {
    const startTimeStr = formatHevyDate(w.start_time);
    const endTimeStr = formatHevyDate(w.end_time || w.start_time);
    const startTime = new Date(w.start_time);
    const endTime = w.end_time ? new Date(w.end_time) : startTime;
    const workoutId = `w_${startTime.getTime()}_${(w.title || 'Workout').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}`;

    supabaseWorkouts.push({
      id: workoutId,
      title: w.title || 'Workout',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      description: w.description || '',
    });

    let setGlobalIdx = 0;
    for (const ex of (w.exercises || [])) {
      for (const set of (ex.sets || [])) {
        const distKm =
          set.distance_meters !== null && set.distance_meters !== undefined
            ? Number((set.distance_meters / 1000).toFixed(3))
            : null;

        const setId = `set_${workoutId}_${setGlobalIdx++}`;

        supabaseSets.push({
          id: setId,
          workout_id: workoutId,
          exercise_title: ex.title || '',
          superset_id: ex.superset_id !== null && ex.superset_id !== undefined ? String(ex.superset_id) : null,
          exercise_notes: ex.notes || '',
          set_index: set.index ?? 0,
          set_type: (set.type || 'normal').toLowerCase(),
          weight_kg: set.weight_kg !== null && set.weight_kg !== undefined ? Number(set.weight_kg) : null,
          reps: set.reps !== null && set.reps !== undefined ? Number(set.reps) : null,
          distance_km: distKm,
          duration_seconds: set.duration_seconds !== null && set.duration_seconds !== undefined ? Number(set.duration_seconds) : null,
          rpe: set.rpe !== null && set.rpe !== undefined ? Number(set.rpe) : null,
          start_time: startTime.toISOString(),
        });

        generatedCsvRows.push({
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
          distance_km: distKm ?? '',
          duration_seconds: set.duration_seconds ?? '',
          rpe: set.rpe ?? '',
        });
      }
    }
  }

  // 5. Upsert to Supabase
  if (supabase) {
    try {
      if (supabaseWorkouts.length > 0) {
        const { error: wErr } = await supabase.from('workouts').upsert(supabaseWorkouts);
        if (wErr) console.error('Supabase workout upsert error:', wErr);
      }
      if (supabaseSets.length > 0) {
        // Upsert in batches of 200
        for (let i = 0; i < supabaseSets.length; i += 200) {
          const chunk = supabaseSets.slice(i, i + 200);
          const { error: sErr } = await supabase.from('workout_sets').upsert(chunk);
          if (sErr) console.error('Supabase sets upsert error:', sErr);
        }
      }
    } catch (dbErr) {
      console.error('Failed to upsert to Supabase during sync:', dbErr);
    }
  }

  // 6. Safe update of local CSV (in writable environments like Localhost)
  try {
    const backupPath = path.resolve(process.cwd(), csvDir, 'workout_data.backup.csv');
    if (fs.existsSync(csvPath)) {
      fs.copyFileSync(csvPath, backupPath);
    }

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
        data: generatedCsvRows,
      },
      {
        header: false,
        quotes: (_value, colIndex) => [0, 1, 2, 3, 4, 6, 8].includes(colIndex),
        newline: '\r\n',
      }
    );

    let updatedCsv = '';
    if (existingContent && existingContent.includes('\n')) {
      const firstNewline = existingContent.indexOf('\n');
      const headerLine = existingContent.slice(0, firstNewline + 1);
      const remainingLines = existingContent.slice(firstNewline + 1);
      updatedCsv = `${headerLine}${newCsvLines}\r\n${remainingLines}`;
    } else {
      const header =
        '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"\r\n';
      updatedCsv = `${header}${newCsvLines}\r\n`;
    }

    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, updatedCsv, 'utf8');

    const distCsvPath = path.resolve(process.cwd(), 'dist', csvDir, 'workout_data.csv');
    if (fs.existsSync(path.dirname(distCsvPath))) {
      fs.writeFileSync(distCsvPath, updatedCsv, 'utf8');
    }
  } catch (fsErr) {
    // Read-only filesystem on Vercel/AWS Lambda
    console.log('Local CSV write skipped (serverless environment)');
  }

  return {
    success: true,
    updated: true,
    newWorkoutsCount: newWorkouts.length,
    newRowsCount: generatedCsvRows.length,
    latestWorkout: {
      title: newWorkouts[0].title || 'Workout',
      startTime: formatHevyDate(newWorkouts[0].start_time),
    },
    message: `ซิงค์สำเร็จ! เพิ่ม ${newWorkouts.length} workout ใหม่ (${generatedCsvRows.length} เซ็ต)`,
  };
}
