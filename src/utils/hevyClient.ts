import { supabase } from '../lib/supabase';

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

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  const res = await fetch('/api/sync-hevy/status', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch sync status: ${res.statusText}`);
  }
  return await res.json();
}

export async function triggerHevySync(apiKey?: string): Promise<SyncResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  const res = await fetch('/api/sync-hevy', {
    method: 'POST',
    headers,
    body: JSON.stringify(apiKey ? { apiKey } : {}),
  });

  const data = await res.json();
  if (!res.ok && !data.message) {
    throw new Error(`Sync request failed with status ${res.status}`);
  }
  return data;
}

