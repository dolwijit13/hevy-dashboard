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
  newMeasurementsCount?: number;
  latestWorkout?: {
    title: string;
    startTime: string;
  };
  latestMeasurement?: {
    date: string;
    weightKg?: number;
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
  totalMeasurementsInDb?: number;
  latestMeasurementDate?: string | null;
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

export function formatDateToYYYYMMDD(d: Date): string {
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMeasurementCsvDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const month = MONTHS[monthIdx] || parts[1];
    return `${day} ${month} ${year}, 00:00`;
  }
  return dateStr;
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
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
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
      const [wCountRes, sCountRes, latestRes, mCountRes, mLatestRes] = await Promise.all([
        supabase.from('workouts').select('*', { count: 'exact', head: true }),
        supabase.from('workout_sets').select('*', { count: 'exact', head: true }),
        supabase.from('workouts').select('start_time').order('start_time', { ascending: false }).limit(1),
        supabase.from('body_measurements').select('*', { count: 'exact', head: true }),
        supabase.from('body_measurements').select('date').order('date', { ascending: false }).limit(1),
      ]);

      const latestDateStr = latestRes.data?.[0]?.start_time
        ? formatHevyDate(latestRes.data[0].start_time)
        : null;

      const latestMeasurementDate = mLatestRes.data?.[0]?.date || null;

      return {
        configured: Boolean(apiKey),
        hasKey: Boolean(apiKey),
        latestDateInCsv: latestDateStr,
        totalWorkoutsInCsv: wCountRes.count || 0,
        totalSetsInCsv: sCountRes.count || 0,
        totalMeasurementsInDb: mCountRes.count || 0,
        latestMeasurementDate,
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

export async function syncWorkoutsOnly(options?: {
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

export interface MeasurementSyncResult {
  success: boolean;
  updated: boolean;
  newMeasurementsCount: number;
  latestMeasurement?: {
    date: string;
    weightKg?: number;
  };
  message: string;
  error?: string;
  details?: any;
}

export async function syncMeasurementsOnly(options?: {
  overrideApiKey?: string;
  csvDir?: string;
}): Promise<MeasurementSyncResult> {
  const csvDir = options?.csvDir || 'raw';
  const apiKey = getHevyApiKey(options?.overrideApiKey);

  if (!apiKey) {
    return {
      success: false,
      updated: false,
      newMeasurementsCount: 0,
      message: 'ไม่พบ HEVY_API_KEY กรุณาระบุใน Environment Variables ของ Vercel หรือ .env.local',
      error: 'NO_API_KEY',
    };
  }

  const supabase = getSupabaseServerClient();
  let latestDateInDb = '';
  let latestDbRow: any = null;

  // 1. Check Supabase first for latest measurement date
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        latestDbRow = data[0];
        latestDateInDb = data[0].date || '';
      }
    } catch (err) {
      console.warn('Could not query latest measurement from Supabase:', err);
    }
  }

  // 2. Also check local measurement_data.csv if present
  const csvPath = path.resolve(process.cwd(), csvDir, 'measurement_data.csv');
  let existingCsvRows: any[] = [];

  if (fs.existsSync(csvPath)) {
    try {
      const content = fs.readFileSync(csvPath, 'utf8');
      const parsed = Papa.parse<any>(content, { header: true, skipEmptyLines: true });
      existingCsvRows = parsed.data || [];
      for (const row of existingCsvRows) {
        if (row.date) {
          const d = parseFlexibleDate(row.date);
          const ymd = formatDateToYYYYMMDD(d);
          if (!latestDateInDb || ymd > latestDateInDb) {
            latestDateInDb = ymd;
          }
        }
      }
    } catch (_) {}
  }

  // 3. Fetch from Hevy API paginated (Hevy pageSize limit is 10)
  const gatheredMeasurements: any[] = [];
  let page = 1;
  const pageSize = 10;
  const maxPages = latestDateInDb ? 5 : 10;
  let reachedOlder = false;

  while (!reachedOlder && page <= maxPages) {
    let res: Response;
    try {
      res = await fetch(`https://api.hevyapp.com/v1/body_measurements?page=${page}&pageSize=${pageSize}`, {
        headers: {
          'api-key': apiKey,
          Accept: 'application/json',
        },
      });
    } catch (netErr: any) {
      return {
        success: false,
        updated: false,
        newMeasurementsCount: 0,
        message: `เชื่อมต่อ Hevy API Body Measurements ไม่สำเร็จ: ${netErr.message}`,
        error: 'NETWORK_ERROR',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        updated: false,
        newMeasurementsCount: 0,
        message: 'HEVY_API_KEY ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง (ต้องใช้ Hevy Pro)',
        error: 'UNAUTHORIZED',
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        updated: false,
        newMeasurementsCount: 0,
        message: `Hevy API แจ้มข้อผิดพลาด Body Measurements (${res.status}): ${errText}`,
        error: `HTTP_${res.status}`,
      };
    }

    const data = await res.json();
    const items = data.body_measurements || [];
    if (items.length === 0) break;

    for (const m of items) {
      if (!m.date) continue;
      const dateYmd = m.date.trim();

      // If strictly older than our latest known date in DB/CSV, we can stop
      if (latestDateInDb && dateYmd < latestDateInDb) {
        reachedOlder = true;
        break;
      }

      gatheredMeasurements.push(m);
    }

    if (reachedOlder || page >= (data.page_count || 1)) {
      break;
    }
    page++;
  }

  if (gatheredMeasurements.length === 0) {
    return {
      success: true,
      updated: false,
      newMeasurementsCount: 0,
      message: 'ข้อมูลสัดส่วนร่างกายเป็นปัจจุบันแล้ว',
    };
  }

  const num = (v: any) =>
    v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null;

  const measurementsToUpsert = gatheredMeasurements.map((m) => ({
    date: m.date.trim(),
    weight_kg: num(m.weight_kg ?? m.weight),
    fat_percent: num(m.fat_percent ?? m.body_fat_percentage),
    neck_cm: num(m.neck_cm ?? m.neck),
    shoulder_cm: num(m.shoulder_cm ?? m.shoulder ?? m.shoulders),
    chest_cm: num(m.chest_cm ?? m.chest),
    left_bicep_cm: num(m.left_bicep_cm ?? m.left_bicep),
    right_bicep_cm: num(m.right_bicep_cm ?? m.right_bicep),
    left_forearm_cm: num(m.left_forearm_cm ?? m.left_forearm),
    right_forearm_cm: num(m.right_forearm_cm ?? m.right_forearm),
    abdomen_cm: num(m.abdomen_cm ?? m.abdomen),
    waist_cm: num(m.waist_cm ?? m.waist),
    hips_cm: num(m.hips_cm ?? m.hips),
    left_thigh_cm: num(m.left_thigh_cm ?? m.left_thigh),
    right_thigh_cm: num(m.right_thigh_cm ?? m.right_thigh),
    left_calf_cm: num(m.left_calf_cm ?? m.left_calf),
    right_calf_cm: num(m.right_calf_cm ?? m.right_calf),
    created_at: m.created_at || new Date().toISOString(),
  }));

  // Detect whether there is actually any new date or changed value
  let isActuallyUpdated = false;
  let newDatesCount = 0;

  for (const m of measurementsToUpsert) {
    if (!latestDateInDb || m.date > latestDateInDb) {
      isActuallyUpdated = true;
      newDatesCount++;
    } else if (m.date === latestDateInDb && latestDbRow) {
      const weightDiff = Math.abs((m.weight_kg ?? 0) - (Number(latestDbRow.weight_kg) || 0));
      const waistDiff = Math.abs((m.waist_cm ?? 0) - (Number(latestDbRow.waist_cm) || 0));
      const shoulderDiff = Math.abs((m.shoulder_cm ?? 0) - (Number(latestDbRow.shoulder_cm) || 0));
      const chestDiff = Math.abs((m.chest_cm ?? 0) - (Number(latestDbRow.chest_cm) || 0));
      if (weightDiff > 0.05 || waistDiff > 0.1 || shoulderDiff > 0.1 || chestDiff > 0.1) {
        isActuallyUpdated = true;
      }
    }
  }

  // 4. Upsert into Supabase
  if (supabase && measurementsToUpsert.length > 0) {
    try {
      const { error: mErr } = await supabase
        .from('body_measurements')
        .upsert(measurementsToUpsert, { onConflict: 'date' });
      if (mErr) {
        console.error('Supabase body_measurements upsert error:', mErr);
      }
    } catch (dbErr) {
      console.error('Failed to upsert measurements to Supabase:', dbErr);
    }
  }

  // 5. Update local CSV if writable
  try {
    const csvRowMap = new Map<string, any>();
    for (const r of existingCsvRows) {
      if (r.date) {
        const d = parseFlexibleDate(r.date);
        const ymd = formatDateToYYYYMMDD(d);
        csvRowMap.set(ymd, r);
      }
    }

    for (const m of measurementsToUpsert) {
      const csvDateFormatted = formatMeasurementCsvDate(m.date);
      csvRowMap.set(m.date, {
        date: csvDateFormatted,
        weight_kg: m.weight_kg ?? '',
        fat_percent: m.fat_percent ?? '',
        neck_cm: m.neck_cm ?? '',
        shoulder_cm: m.shoulder_cm ?? '',
        chest_cm: m.chest_cm ?? '',
        left_bicep_cm: m.left_bicep_cm ?? '',
        right_bicep_cm: m.right_bicep_cm ?? '',
        left_forearm_cm: m.left_forearm_cm ?? '',
        right_forearm_cm: m.right_forearm_cm ?? '',
        abdomen_cm: m.abdomen_cm ?? '',
        waist_cm: m.waist_cm ?? '',
        hips_cm: m.hips_cm ?? '',
        left_thigh_cm: m.left_thigh_cm ?? '',
        right_thigh_cm: m.right_thigh_cm ?? '',
        left_calf_cm: m.left_calf_cm ?? '',
        right_calf_cm: m.right_calf_cm ?? '',
      });
    }

    const sortedEntries = Array.from(csvRowMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const updatedData = sortedEntries.map((e) => e[1]);

    const updatedCsv = Papa.unparse(
      {
        fields: [
          'date',
          'weight_kg',
          'fat_percent',
          'neck_cm',
          'shoulder_cm',
          'chest_cm',
          'left_bicep_cm',
          'right_bicep_cm',
          'left_forearm_cm',
          'right_forearm_cm',
          'abdomen_cm',
          'waist_cm',
          'hips_cm',
          'left_thigh_cm',
          'right_thigh_cm',
          'left_calf_cm',
          'right_calf_cm',
        ],
        data: updatedData,
      },
      {
        quotes: (_v, colIdx) => colIdx === 0,
        newline: '\r\n',
      }
    );

    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, updatedCsv, 'utf8');

    const distCsvPath = path.resolve(process.cwd(), 'dist', csvDir, 'measurement_data.csv');
    if (fs.existsSync(path.dirname(distCsvPath))) {
      fs.writeFileSync(distCsvPath, updatedCsv, 'utf8');
    }
  } catch (fsErr) {
    // Read-only filesystem on Vercel
  }

  const latest = measurementsToUpsert[0];

  return {
    success: true,
    updated: isActuallyUpdated,
    newMeasurementsCount: newDatesCount > 0 ? newDatesCount : (isActuallyUpdated ? 1 : 0),
    latestMeasurement: {
      date: latest.date,
      weightKg: latest.weight_kg ?? undefined,
    },
    message: isActuallyUpdated
      ? `ซิงค์สัดส่วนสำเร็จ! ${newDatesCount > 0 ? `พบข้อมูลใหม่ ${newDatesCount} วัน` : 'อัปเดตข้อมูลล่าสุดเรียบร้อย'}`
      : 'ข้อมูลสัดส่วนร่างกายเป็นปัจจุบันแล้ว',
  };
}

export async function syncHevyAll(options?: {
  overrideApiKey?: string;
  csvDir?: string;
}): Promise<SyncResult> {
  const [workoutRes, measurementRes] = await Promise.all([
    syncWorkoutsOnly(options),
    syncMeasurementsOnly(options),
  ]);

  if (workoutRes.error === 'NO_API_KEY' || measurementRes.error === 'NO_API_KEY') {
    return {
      success: false,
      updated: false,
      newWorkoutsCount: 0,
      newRowsCount: 0,
      newMeasurementsCount: 0,
      message: 'ไม่พบ HEVY_API_KEY กรุณาระบุใน Environment Variables ของ Vercel หรือ .env.local',
      error: 'NO_API_KEY',
    };
  }

  if (workoutRes.error === 'UNAUTHORIZED' || measurementRes.error === 'UNAUTHORIZED') {
    return {
      success: false,
      updated: false,
      newWorkoutsCount: 0,
      newRowsCount: 0,
      newMeasurementsCount: 0,
      message: 'HEVY_API_KEY ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง (ต้องใช้ Hevy Pro)',
      error: 'UNAUTHORIZED',
    };
  }

  const updated = workoutRes.updated || measurementRes.updated;
  const newWorkoutsCount = workoutRes.newWorkoutsCount || 0;
  const newRowsCount = workoutRes.newRowsCount || 0;
  const newMeasurementsCount = measurementRes.newMeasurementsCount || 0;

  let message = 'ข้อมูลเป็นปัจจุบันแล้ว ไม่มี workout หรือสัดส่วนใหม่ที่ต้องอัปเดต';
  if (newWorkoutsCount > 0 && newMeasurementsCount > 0) {
    message = `ซิงค์สำเร็จ! เพิ่ม ${newWorkoutsCount} workout (${newRowsCount} เซ็ต) และข้อมูลสัดส่วน ${newMeasurementsCount} วันล่าสุด`;
  } else if (newWorkoutsCount > 0) {
    message = `ซิงค์สำเร็จ! เพิ่ม ${newWorkoutsCount} workout ใหม่ (${newRowsCount} เซ็ต)`;
  } else if (newMeasurementsCount > 0) {
    const weightInfo = measurementRes.latestMeasurement?.weightKg
      ? ` (น้ำหนักล่าสุด ${measurementRes.latestMeasurement.weightKg} kg)`
      : '';
    message = `ซิงค์สำเร็จ! อัปเดตข้อมูลสัดส่วนร่างกาย ${newMeasurementsCount} วันล่าสุด${weightInfo}`;
  }

  return {
    success: workoutRes.success || measurementRes.success,
    updated,
    newWorkoutsCount,
    newRowsCount,
    newMeasurementsCount,
    latestWorkout: workoutRes.latestWorkout,
    latestMeasurement: measurementRes.latestMeasurement,
    message,
    details: {
      workout: workoutRes,
      measurement: measurementRes,
    },
  };
}

export const syncHevyWorkouts = syncHevyAll;
