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

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await fetch('/api/sync-hevy/status');
  if (!res.ok) {
    throw new Error(`Failed to fetch sync status: ${res.statusText}`);
  }
  return await res.json();
}

export async function triggerHevySync(apiKey?: string): Promise<SyncResult> {
  const res = await fetch('/api/sync-hevy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiKey ? { apiKey } : {}),
  });

  const data = await res.json();
  if (!res.ok && !data.message) {
    throw new Error(`Sync request failed with status ${res.status}`);
  }
  return data;
}

