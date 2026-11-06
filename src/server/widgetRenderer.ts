import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { getSupabaseServerClient } from './hevySync.ts';
import { getRoutineFromTitle } from '../config/routineConfig.ts';

export interface WidgetDay {
  dateStr: string;
  day: number;
  month: number;
  year: number;
  count: number;
  title: string;
  routineId?: string;
}

export interface WidgetOptions {
  weeks?: number;
  mode?: 'volume' | 'routine';
  theme?: 'dark' | 'amoled';
  transparent?: boolean;
}

export interface WidgetData {
  latestWorkout: {
    title: string;
    date: string;
    relativeText: string;
  };
  totalWorkoutsInRange: number;
  totalSetsInRange: number;
  activeDaysInRange: number;
  weeklyStreak: number;
  displayWeeks: (WidgetDay | null)[][];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ROUTINE_HEX_COLORS: Record<string, { fill: string; stroke: string }> = {
  routine_a: { fill: '#0284c7', stroke: '#38bdf8' },
  routine_b: { fill: '#4f46e5', stroke: '#818cf8' },
  routine_c: { fill: '#d97706', stroke: '#fbbf24' },
  routine_d: { fill: '#e11d48', stroke: '#fb7185' },
  routine_e: { fill: '#c026d3', stroke: '#e879f9' },
  push: { fill: '#ea580c', stroke: '#fb923c' },
  pull: { fill: '#2563eb', stroke: '#60a5fa' },
  legs: { fill: '#059669', stroke: '#34d399' },
  upper: { fill: '#0d9488', stroke: '#2dd4bf' },
  chest: { fill: '#dc2626', stroke: '#f87171' },
  back: { fill: '#0891b2', stroke: '#22d3ee' },
  shoulders: { fill: '#7c3aed', stroke: '#a78bfa' },
  arms: { fill: '#ca8a04', stroke: '#facc15' },
  core: { fill: '#475569', stroke: '#94a3b8' },
  cardio: { fill: '#db2777', stroke: '#f472b6' },
  other: { fill: '#059669', stroke: '#10b981' },
};

function formatRelativeDate(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  const day = d.getDate();
  const m = MONTH_NAMES[d.getMonth()];
  return `${day} ${m}`;
}

export async function fetchRawSessions(): Promise<{ date: Date; dateStr: string; title: string }[]> {
  const supabase = getSupabaseServerClient();
  const sessions: { date: Date; dateStr: string; title: string }[] = [];

  // 1. Try querying Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('title, start_time')
        .order('start_time', { ascending: false })
        .limit(1000);

      if (!error && data && data.length > 0) {
        for (const row of data) {
          const d = new Date(row.start_time);
          if (isNaN(d.getTime())) continue;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          sessions.push({
            date: d,
            dateStr: `${y}-${m}-${day}`,
            title: row.title || 'Workout',
          });
        }
        return sessions;
      }
    } catch (err) {
      console.warn('Failed to query Supabase for widget, falling back to CSV:', err);
    }
  }

  // 2. Fallback to local CSV (raw/workout_data.csv or dist/raw/workout_data.csv)
  const candidatePaths = [
    path.resolve(process.cwd(), 'raw', 'workout_data.csv'),
    path.resolve(process.cwd(), 'dist', 'raw', 'workout_data.csv'),
  ];

  for (const csvPath of candidatePaths) {
    if (fs.existsSync(csvPath)) {
      try {
        const content = fs.readFileSync(csvPath, 'utf8');
        const parsed = Papa.parse<any>(content, { header: true, skipEmptyLines: true }).data;
        for (const row of parsed) {
          if (!row.start_time) continue;
          const rawDate = row.start_time.split(',')[0].trim();
          const parts = rawDate.split(/\s+/);
          if (parts.length >= 3) {
            const day = parseInt(parts[0], 10);
            const mStr = parts[1].toLowerCase().slice(0, 3);
            const monthMap: Record<string, number> = {
              jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
              jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
            };
            const month = monthMap[mStr] ?? 0;
            const year = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            const yStr = year;
            const mStrPad = String(month + 1).padStart(2, '0');
            const dStrPad = String(day).padStart(2, '0');
            sessions.push({
              date: d,
              dateStr: `${yStr}-${mStrPad}-${dStrPad}`,
              title: row.title || 'Workout',
            });
          }
        }
        break;
      } catch (e) {
        console.warn('Error reading CSV for widget:', e);
      }
    }
  }

  return sessions;
}

export async function getWidgetData(weeksCount = 18): Promise<WidgetData> {
  const sessions = await fetchRawSessions();
  // Map dateStr to { sessionTitles: Set, setCount: number, latestTitle: string, date: Date }
  const dayMap = new Map<string, { sessionTitles: Set<string>; setCount: number; latestTitle: string; date: Date }>();
  let latestDate = new Date(0);
  let latestTitle = 'Workout';

  for (const s of sessions) {
    if (s.date > latestDate) {
      latestDate = s.date;
      latestTitle = s.title;
    }
    const cur = dayMap.get(s.dateStr) || { sessionTitles: new Set<string>(), setCount: 0, latestTitle: s.title, date: s.date };
    cur.sessionTitles.add(s.title);
    cur.setCount++;
    cur.latestTitle = s.title;
    dayMap.set(s.dateStr, cur);
  }

  // Calculate Weekly Streak
  const weekSet = new Set<string>();
  sessions.forEach((s) => {
    const d = new Date(Date.UTC(s.date.getFullYear(), s.date.getMonth(), s.date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    weekSet.add(`${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`);
  });

  const sortedWeeks = Array.from(weekSet).sort();
  let weeklyStreak = 0;
  if (sortedWeeks.length > 0) {
    weeklyStreak = 1;
    for (let i = sortedWeeks.length - 1; i > 0; i--) {
      const [y1, w1] = sortedWeeks[i].split('-W').map(Number);
      const [y0, w0] = sortedWeeks[i - 1].split('-W').map(Number);
      const idx1 = y1 * 52 + w1;
      const idx0 = y0 * 52 + w0;
      if (idx1 - idx0 === 1) {
        weeklyStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate Grid
  const validWeeks = Math.max(12, Math.min(26, weeksCount));
  const endDate = latestDate.getTime() > 0 ? new Date(latestDate) : new Date();
  const endDay = (endDate.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (validWeeks * 7 - 1) - endDay);

  const allWeeks: (WidgetDay | null)[][] = [];
  let curWeek: (WidgetDay | null)[] = [];
  const cursor = new Date(startDate);
  let totalWorkoutsInRange = 0;
  let totalSetsInRange = 0;
  let activeDaysInRange = 0;

  while (cursor <= endDate) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const info = dayMap.get(key);
    const workoutsOnDay = info ? info.sessionTitles.size : 0;
    const setsOnDay = info ? info.setCount : 0;
    const title = info ? info.latestTitle : '';

    if (workoutsOnDay > 0) {
      totalWorkoutsInRange += workoutsOnDay;
      totalSetsInRange += setsOnDay;
      activeDaysInRange++;
    }

    const routine = title ? getRoutineFromTitle(title) : undefined;

    curWeek.push({
      dateStr: key,
      day: cursor.getDate(),
      month: cursor.getMonth(),
      year: cursor.getFullYear(),
      count: workoutsOnDay,
      title,
      routineId: routine?.id,
    });

    if (curWeek.length === 7) {
      allWeeks.push(curWeek);
      curWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (curWeek.length > 0) {
    while (curWeek.length < 7) curWeek.push(null);
    allWeeks.push(curWeek);
  }

  const displayWeeks = allWeeks.slice(-validWeeks);

  return {
    latestWorkout: {
      title: latestTitle,
      date: latestDate.getTime() > 0 ? latestDate.toISOString() : '',
      relativeText: latestDate.getTime() > 0 ? formatRelativeDate(latestDate) : 'No data',
    },
    totalWorkoutsInRange,
    totalSetsInRange,
    activeDaysInRange,
    weeklyStreak,
    displayWeeks,
  };
}

export function renderHeatmapSvg(data: WidgetData, options: WidgetOptions = {}): string {
  const weeksCount = data.displayWeeks.length;
  const mode = options.mode || 'volume';
  const theme = options.theme || 'dark';
  const isTransparent = Boolean(options.transparent);

  const cellSize = 26;
  const cellGap = 7;
  const leftMargin = 52;
  const topGridY = 100;
  const rx = 6;

  const width = leftMargin + weeksCount * (cellSize + cellGap) + 32;
  const height = 360;

  // Background styling
  const bgFill = isTransparent
    ? 'none'
    : theme === 'amoled'
    ? '#000000'
    : 'url(#cardBg)';
  const borderStroke = isTransparent ? 'none' : '#27272a';

  // Build Months & Cells
  let monthsSvg = '';
  let cellsSvg = '';
  let lastMonth = -1;

  data.displayWeeks.forEach((week, wIdx) => {
    const x = leftMargin + wIdx * (cellSize + cellGap);

    const firstValid = week.find((d) => d !== null);
    if (firstValid && firstValid.month !== lastMonth) {
      lastMonth = firstValid.month;
      monthsSvg += `<text x="${x}" y="88" class="month-lbl">${MONTH_NAMES[firstValid.month]}</text>\n`;
    }

    week.forEach((day, dIdx) => {
      if (!day) return;
      const y = topGridY + dIdx * (cellSize + cellGap);
      let fill = '#18181b';
      let stroke = '#27272a';
      let strokeWidth = 1;

      if (day.count > 0) {
        if (mode === 'routine' && day.routineId && ROUTINE_HEX_COLORS[day.routineId]) {
          fill = ROUTINE_HEX_COLORS[day.routineId].fill;
          stroke = ROUTINE_HEX_COLORS[day.routineId].stroke;
        } else {
          // Volume intensity
          if (day.count === 1) {
            fill = '#059669';
            stroke = '#10b981';
          } else if (day.count === 2) {
            fill = '#10b981';
            stroke = '#34d399';
          } else {
            fill = '#34d399';
            stroke = '#6ee7b7';
          }
        }
      }

      cellsSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`;
    });
  });

  // Footer Legend
  let legendSvg = '';
  if (mode === 'routine') {
    legendSvg = `
      <g transform="translate(${width - 240}, -10)">
        <circle cx="0" cy="5" r="4" fill="#0284c7" />
        <text x="8" y="9" class="foot-txt">A</text>
        <circle cx="28" cy="5" r="4" fill="#4f46e5" />
        <text x="36" y="9" class="foot-txt">B</text>
        <circle cx="56" cy="5" r="4" fill="#d97706" />
        <text x="64" y="9" class="foot-txt">C</text>
        <circle cx="84" cy="5" r="4" fill="#e11d48" />
        <text x="92" y="9" class="foot-txt">D</text>
        <circle cx="112" cy="5" r="4" fill="#c026d3" />
        <text x="120" y="9" class="foot-txt">E</text>
        <circle cx="140" cy="5" r="4" fill="#059669" />
        <text x="148" y="9" class="foot-txt">Legs</text>
      </g>
    `;
  } else {
    legendSvg = `
      <g transform="translate(${width - 180}, -10)">
        <text x="-36" y="9" class="foot-txt">Less</text>
        <rect x="-6" y="0" width="10" height="10" rx="2" fill="#18181b" stroke="#27272a" />
        <rect x="8" y="0" width="10" height="10" rx="2" fill="#059669" />
        <rect x="22" y="0" width="10" height="10" rx="2" fill="#10b981" />
        <rect x="36" y="0" width="10" height="10" rx="2" fill="#34d399" />
        <text x="52" y="9" class="foot-txt">More</text>
      </g>
    `;
  }

  const streakText = data.weeklyStreak > 0 ? `🔥 ${data.weeklyStreak} WEEKS` : '🔥 ACTIVE';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="cardBg" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#18231e" />
      <stop offset="60%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#040405" />
    </radialGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0.1" />
    </linearGradient>
    <style>
      .app-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 17px; font-weight: 800; fill: #ffffff; letter-spacing: -0.3px; }
      .app-sub { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: 500; fill: #a1a1aa; }
      .streak-val { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 800; fill: #34d399; letter-spacing: 0.3px; }
      .month-lbl { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: 600; fill: #71717a; }
      .day-lbl { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; font-weight: 600; fill: #71717a; text-anchor: middle; }
      .foot-txt { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: 500; fill: #71717a; }
      .foot-val { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: 700; fill: #e4e4e7; }
    </style>
  </defs>

  <!-- Card Background -->
  <rect width="${width}" height="${height}" rx="28" fill="${bgFill}" stroke="${borderStroke}" stroke-width="1.5" />

  <!-- Ambient Light in Header -->
  <circle cx="${width - 100}" cy="46" r="60" fill="#10b981" fill-opacity="0.08" />

  <!-- Header: App Brand -->
  <g transform="translate(24, 22)">
    <rect width="40" height="40" rx="12" fill="url(#badgeGrad)" stroke="#10b981" stroke-opacity="0.4" stroke-width="1" />
    <!-- Crisp Material Dumbbell Icon -->
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43 1.43 1.43 2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill="#10b981" transform="translate(8, 8)" />

    <text x="52" y="19" class="app-title">Hevy Consistency</text>
    <text x="52" y="34" class="app-sub">Last ${weeksCount} Weeks • ${data.totalWorkoutsInRange} Workouts (${data.totalSetsInRange.toLocaleString()} sets)</text>
  </g>

  <!-- Streak Pill Badge -->
  <g transform="translate(${width - 160}, 24)">
    <rect width="136" height="36" rx="18" fill="url(#badgeGrad)" stroke="#10b981" stroke-opacity="0.35" stroke-width="1" />
    <text x="68" y="23" text-anchor="middle" class="streak-val">${streakText}</text>
  </g>

  <!-- Day Labels (Mon, Wed, Fri, Sun) -->
  <text x="32" y="${topGridY + 0 * (cellSize + cellGap) + 17}" class="day-lbl">M</text>
  <text x="32" y="${topGridY + 2 * (cellSize + cellGap) + 17}" class="day-lbl">W</text>
  <text x="32" y="${topGridY + 4 * (cellSize + cellGap) + 17}" class="day-lbl">F</text>
  <text x="32" y="${topGridY + 6 * (cellSize + cellGap) + 17}" class="day-lbl">S</text>

  <!-- Months Header -->
  ${monthsSvg}

  <!-- Heatmap Cells -->
  ${cellsSvg}

  <!-- Footer Info -->
  <g transform="translate(32, 338)">
    <text x="0" y="0" class="foot-txt">Latest: <tspan class="foot-val">${data.latestWorkout.title}</tspan> (${data.latestWorkout.relativeText})</text>
    ${legendSvg}
  </g>
</svg>`;
}
