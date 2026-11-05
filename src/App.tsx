import React, { useState, useEffect, useMemo } from 'react';
import { TimeFilter, CustomDateRange, WorkoutSet, WorkoutSession, BodyMeasurement } from './types/fitness';
import { parseWorkoutCsv, parseMeasurementCsv } from './utils/csvLoader';
import { fetchWorkoutData, fetchMeasurementData } from './utils/supabaseLoader';
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
  LayoutDashboard,
  Dumbbell,
  Activity,
  Scale,
  Lock,
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

  // Main data states
  const [allSets, setAllSets] = useState<WorkoutSet[]>([]);
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<BodyMeasurement[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'csv'>('supabase');
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

  // Optional Passcode Security (if VITE_APP_PIN is configured)
  const appPin = import.meta.env.VITE_APP_PIN;
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (!appPin) return true;
    return localStorage.getItem('hevy_app_pin') === appPin;
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const loadDefaultData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [wResult, mResult] = await Promise.all([
        fetchWorkoutData(),
        fetchMeasurementData(),
      ]);
      setAllSets(wResult.sets);
      setAllSessions(wResult.sessions);
      setAllMeasurements(mResult.measurements);
      setDataSource(wResult.source);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        'ไม่สามารถโหลดข้อมูลได้ คุณสามารถใช้ปุ่ม "Workout CSV" ด้านบนเพื่อเลือกไฟล์ได้โดยตรง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadDefaultData();
    }
  }, [isUnlocked]);

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

  const handleUploadWorkoutCsv = (csvText: string) => {
    const parsed = parseWorkoutCsv(csvText);
    setAllSets(parsed.sets);
    setAllSessions(parsed.sessions);
    setDataSource('csv');
    setSyncToast({
      type: 'info',
      message: `โหลดไฟล์ Workout CSV สำเร็จ (${parsed.sessions.length} เซสชัน)`,
    });
  };

  const handleUploadMeasurementCsv = (csvText: string) => {
    const parsed = parseMeasurementCsv(csvText);
    setAllMeasurements(parsed);
    setDataSource('csv');
    setSyncToast({
      type: 'info',
      message: `โหลดไฟล์ Body CSV สำเร็จ (${parsed.length} รายการ)`,
    });
  };

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === appPin) {
      localStorage.setItem('hevy_app_pin', pinInput.trim());
      setIsUnlocked(true);
      setPinError(null);
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Lock screen view if PIN protection is active
  if (!isUnlocked && appPin) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <form
          onSubmit={handlePinSubmit}
          className="bg-zinc-950 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-glow-emerald">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Hevy Analytics Pro</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-6">กรุณาระบุรหัส PIN เพื่อเข้าใช้งาน</p>

          <input
            type="password"
            maxLength={8}
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(null);
            }}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-widest bg-zinc-900 border border-white/10 rounded-2xl py-3 text-white focus:outline-none focus:border-emerald-500 font-mono mb-3"
            autoFocus
          />

          {pinError && <p className="text-xs text-rose-400 mb-4">{pinError}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-glow-emerald"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  const mobileTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'muscles', label: 'Muscles', icon: Activity },
    { id: 'body', label: 'Body', icon: Scale },
  ] as const;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Header
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        includeWarmup={includeWarmup}
        onToggleWarmup={() => setIncludeWarmup((prev) => !prev)}
        onUploadWorkoutCsv={handleUploadWorkoutCsv}
        onUploadMeasurementCsv={handleUploadMeasurementCsv}
        onResetDefaultData={loadDefaultData}
        onSyncHevy={() => handleSyncHevy()}
        isSyncing={isSyncing}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6 pb-28 md:pb-12">
        {/* Source Badge */}
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                dataSource === 'supabase' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-cyan-400'
              }`}
            />
            {dataSource === 'supabase' ? 'Cloud Connected (Supabase)' : 'Local File (/raw/*.csv)'}
          </span>
          <span>{allSessions.length.toLocaleString()} workouts total</span>
        </div>

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

      {/* Mobile Bottom Navigation Bar (Thumb friendly on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around safe-area-bottom">
        {mobileTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-semibold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Sync Notification Toast */}
      {syncToast && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-start gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 ${
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
              (สำหรับสมาชิก Hevy Pro) หรือใส่ไว้ในไฟล์{' '}
              <code className="text-white bg-zinc-900 px-1 py-0.5 rounded border border-white/10 font-mono">
                .env.local
              </code>
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

      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500 font-mono hidden md:block">
        Hevy Fitness Analytics • Connected to {dataSource === 'supabase' ? 'Supabase Database' : 'Local CSV'} • {allSessions.length.toLocaleString()} sessions parsed
      </footer>
    </div>
  );
};

export default App;
