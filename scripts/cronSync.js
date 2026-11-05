import { syncHevyWorkouts } from '../src/server/hevySync.ts';

async function main() {
  console.log('Starting scheduled Hevy sync...');
  const result = await syncHevyWorkouts();
  console.log('Sync result:', result);
  if (!result.success && result.error !== 'NO_API_KEY') {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Cron job sync error:', err);
  process.exit(1);
});

