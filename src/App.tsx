import React, { useState, useEffect, useMemo } from 'react';
import { TimeFilter, CustomDateRange } from './types/fitness';
import {
  parseWorkoutCsv,
  parseMeasurementCsv,
  fetchDefaultWorkoutCsv,
  fetchDefaultMeasurementCsv,
} from './utils/csvLoader';
import { triggerHevySync } from './utils/hevyClient';
import {
  filterByTimeRange,
  computeKpis,
  computeExercisePRs,
  computeMonthlyBreakdowns,
} from './utils/workoutAnalytics';
import { Header } from './components/layout/Header';
import { KpiBento } from './components/overview/KpiBento';
import { Heatmap } from './components/overview/Heatmap';
import { KeyLiftSparklines } from './components/overview/KeyLiftSparklines';
import { MonthlyTrends } from './components/overview/MonthlyTrends';
import { RecentLogs } from './components/overview/RecentLogs';
import { ExerciseExplorer } from './components/exercises/ExerciseExplorer';
import { MuscleBalanceView } from './components/muscles/MuscleBalanceView';
import { BodyRecompView } from './components/body/BodyRecompView';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  KeyRound,
  Zap,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exercises' | 'muscles' | 'body'>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customRange, setCustomRange] = useState<CustomDateRange>(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return {
      startDate: '2024-01-01',
      endDate: todayStr,
    };
  });
  const [includeWarmup, setIncludeWarmup] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<string>('Leg Press (Machine)');

  const [rawWorkoutCsv, setRawWorkoutCsv] = useState<string>('');
  const [rawMeasurementCsv, setRawMeasurementCsv] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state & notifications
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
    details?: string;
  } | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  const loadDefaultData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [wCsv, mCsv] = await Promise.all([
        fetchDefaultWorkoutCsv(),
        fetchDefaultMeasurementCsv(),
      ]);
      setRawWorkoutCsv(wCsv);
      setRawMeasurementCsv(mCsv);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        'ไม่สามารถโหลดไฟล์ CSV จาก /raw โดยอัตโนมัติ คุณสามารถใช้ปุ่ม "Upload CSV" ด้านบนเพื่อเลือกไฟล์ได้โดยตรง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDefaultData();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!syncToast) return;
    const timer = setTimeout(() => {
      setSyncToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [syncToast]);

  const handleSyncHevy = async (overrideKey?: string) => {
    setIsSyncing(true);
    try {
      const result = await triggerHevySync(overrideKey);
      if (result.success) {
        if (result.updated) {
          setSyncToast({
            type: 'success',
            message: result.message,
            details: result.latestWorkout
              ? `ล่าสุด: ${result.latestWorkout.title} (${result.latestWorkout.startTime})`
              : undefined,
          });
          // Immediately reload data to refresh analytics
          await loadDefaultData();
        } else {
          setSyncToast({
            type: 'info',
            message: result.message || 'ข้อมูลเป็นปัจจุบันแล้ว ไม่มี workout ใหม่',
          });
        }
        setShowApiKeyModal(false);
      } else {
        if (result.error === 'NO_API_KEY') {
          setShowApiKeyModal(true);
        } else {
          setSyncToast({
            type: 'error',
            message: result.message || 'ซิงค์ข้อมูลไม่สำเร็จ',
          });
        }
      }
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const { sets: allSets, sessions: allSessions } = useMemo(() => {
    if (!rawWorkoutCsv) return { sets: [], sessions: [] };
    return parseWorkoutCsv(rawWorkoutCsv);
  }, [rawWorkoutCsv]);

  const allPrs = useMemo(() => {
    return computeExercisePRs(allSets);
  }, [allSets]);

  useEffect(() => {
    if (allSets.length > 0 && (!selectedExercise || !allPrs.has(selectedExercise))) {
      const firstExercise = allSets[0].normalizedExercise;
      setSelectedExercise(firstExercise);
    }
  }, [allSets, allPrs, selectedExercise]);

  const filteredSessions = useMemo(() => {
    return filterByTimeRange(allSessions, timeFilter, undefined, customRange);
  }, [allSessions, timeFilter, customRange]);

  const filteredSets = useMemo(() => {
    let s = filterByTimeRange(allSets, timeFilter, undefined, customRange);
    if (!includeWarmup) {
      s = s.filter((item) => item.setType !== 'warmup');
    }
    return s;
  }, [allSets, timeFilter, customRange, includeWarmup]);

  const kpis = useMemo(() => {
    return computeKpis(filteredSessions, filteredSets, Array.from(allPrs.values()));
  }, [filteredSessions, filteredSets, allPrs]);

  const monthlyData = useMemo(() => {
    return computeMonthlyBreakdowns(filteredSessions);
  }, [filteredSessions]);

  const allMeasurements = useMemo(() => {
    if (!rawMeasurementCsv) return [];
    return parseMeasurementCsv(rawMeasurementCsv);
  }, [rawMeasurementCsv]);

  const filteredMeasurements = useMemo(() => {
    if (timeFilter === 'all') return allMeasurements;
    if (timeFilter === 'custom') {
      return allMeasurements.filter(
        (m) => m.dateStr >= customRange.startDate && m.dateStr <= customRange.endDate
      );
    }
    if (['2023', '2024', '2025', '2026'].includes(timeFilter)) {
      const targetYear = parseInt(timeFilter, 10);
      return allMeasurements.filter((m) => m.date.getFullYear() === targetYear);
    }
    return allMeasurements;
  }, [allMeasurements, timeFilter, customRange]);

  const handleSelectExerciseAndNavigate = (name: string) => {
    setSelectedExercise(name);
    setActiveTab('exercises');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Header
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        includeWarmup={includeWarmup}
        onToggleWarmup={() => setIncludeWarmup((prev) => !prev)}
        onUploadWorkoutCsv={(csv) => setRawWorkoutCsv(csv)}
        onUploadMeasurementCsv={(csv) => setRawMeasurementCsv(csv)}
        onResetDefaultData={loadDefaultData}
        onSyncHevy={() => handleSyncHevy()}
        isSyncing={isSyncing}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm font-mono">Analyzing workout sets and body metrics...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: Overview & Consistency */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <KpiBento kpis={kpis} />

                <Heatmap
                  sessions={allSessions}
                  onSelectExercise={handleSelectExerciseAndNavigate}
                />

                <KeyLiftSparklines
                  sets={allSets}
                  allPrs={allPrs}
                  onSelectExercise={handleSelectExerciseAndNavigate}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <MonthlyTrends monthlyData={monthlyData} />
                  </div>
                  <div className="lg:col-span-5">
                    <RecentLogs
                      sessions={filteredSessions}
                      onSelectExercise={handleSelectExerciseAndNavigate}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Exercise & PR Explorer */}
            {activeTab === 'exercises' && (
              <ExerciseExplorer
                sets={filteredSets}
                allPrs={allPrs}
                selectedExercise={selectedExercise}
                onSelectExercise={setSelectedExercise}
              />
            )}

            {/* Tab 3: Muscle Volume & Balance */}
            {activeTab === 'muscles' && <MuscleBalanceView sets={filteredSets} />}

            {/* Tab 4: Body & Recomposition */}
            {activeTab === 'body' && <BodyRecompView measurements={filteredMeasurements} />}
          </>
        )}
      </main>

      {/* Floating Sync Notification Toast */}
      {syncToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 ${
            syncToast.type === 'success'
              ? 'bg-[#0e1f17]/95 border-emerald-500/40 text-emerald-200'
              : syncToast.type === 'error'
              ? 'bg-[#261014]/95 border-rose-500/40 text-rose-200'
              : 'bg-[#18181b]/95 border-zinc-700/60 text-zinc-200'
          }`}
        >
          {syncToast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {syncToast.type === 'error' && (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          {syncToast.type === 'info' && (
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 pr-2">
            <p className="text-xs font-semibold text-white">{syncToast.message}</p>
            {syncToast.details && (
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{syncToast.details}</p>
            )}
          </div>

          <button
            onClick={() => setSyncToast(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* API Key Modal (Triggered if NO_API_KEY) */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-emerald-950/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">ตั้งค่า Hevy API Key</h3>
                <p className="text-xs text-zinc-400">ระบุ API Key เพื่อเชื่อมต่อและดึงข้อมูลอัตโนมัติ</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              คุณสามารถสร้าง Developer API Key ได้จากเว็บ Hevy ที่{' '}
              <a
                href="https://hevy.com/settings?developer"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline font-medium"
              >
                hevy.com/settings?developer
              </a>{' '}
              (สำหรับสมาชิก Hevy Pro) หรือใส่ไว้ในไฟล์ <code className="text-white bg-zinc-900 px-1 py-0.5 rounded border border-white/10 font-mono">.env.local</code>
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-medium text-zinc-300">HEVY_API_KEY:</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="วาง API Key ที่นี่..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSyncHevy(apiKeyInput.trim())}
                disabled={!apiKeyInput.trim() || isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>บันทึก & ซิงค์ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500 font-mono">
        Hevy Fitness Analytics • Running locally on React & Vite • {allSessions.length.toLocaleString()} sessions parsed
      </footer>
    </div>
  );
};

export default App;
