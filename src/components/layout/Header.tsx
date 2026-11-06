import React, { useRef, useState } from 'react';
import { TimeFilter, CustomDateRange } from '../../types/fitness';
import { DateRangePicker } from './DateRangePicker';
import { useAuth } from '../../context/AuthContext';
import { Flame, Dumbbell, Upload, RotateCcw, Filter, Calendar as CalendarIcon, X, Zap, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  customRange: CustomDateRange;
  onCustomRangeChange: (range: CustomDateRange) => void;
  includeWarmup: boolean;
  onToggleWarmup: () => void;
  onUploadWorkoutCsv: (csvText: string) => void;
  onUploadMeasurementCsv: (csvText: string) => void;
  onResetDefaultData: () => void;
  onSyncHevy: () => void;
  isSyncing: boolean;
  isLoading: boolean;
  activeTab: 'overview' | 'exercises' | 'muscles' | 'body' | 'gamification';
  onTabChange: (tab: 'overview' | 'exercises' | 'muscles' | 'body' | 'gamification') => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeFilter,
  onTimeFilterChange,
  customRange,
  onCustomRangeChange,
  includeWarmup,
  onToggleWarmup,
  onUploadWorkoutCsv,
  onUploadMeasurementCsv,
  onResetDefaultData,
  onSyncHevy,
  isSyncing,
  isLoading,
  activeTab,
  onTabChange,
}) => {
  const workoutInputRef = useRef<HTMLInputElement>(null);
  const measurementInputRef = useRef<HTMLInputElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleWorkoutFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          onUploadWorkoutCsv(evt.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleMeasurementFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          onUploadMeasurementCsv(evt.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview & Consistency' },
    { id: 'exercises', label: '🏋️ Exercise & PR Explorer' },
    { id: 'muscles', label: '💪 Muscle Volume & Balance' },
    { id: 'body', label: '⚖️ Body & Recomposition' },
    { id: 'gamification', label: '🎮 Ranks & Quests' },
  ] as const;

  const quickTimeOptions: { label: string; value: TimeFilter }[] = [
    { label: 'All Time', value: 'all' },
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
    { label: 'Last 90d', value: '90d' },
  ];

  const isCustomActive = timeFilter === 'custom';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/85 border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-glow-emerald">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">Hevy Analytics</h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pro
              </span>
            </div>
            <p className="text-xs text-zinc-400">Fitness Analytics & Body Recomposition Dashboard</p>
          </div>
        </div>

        {/* Global Controls: Time Filter & Warmup Toggle & Upload */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto relative">
          {/* Time Filter Pills & Custom Range Trigger */}
          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/10 text-xs">
            <span className="pl-2 pr-1 text-zinc-500 flex items-center gap-1" title="Filter ช่วงเวลา">
              <Filter className="w-3 h-3" />
            </span>
            {quickTimeOptions.map((opt) => {
              const isSelected = timeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onTimeFilterChange(opt.value)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            {/* Custom Range Popover Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className={`ml-1 px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isCustomActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isCustomActive
                    ? `${customRange.startDate} → ${customRange.endDate}`
                    : 'Custom Range ▾'}
                </span>
                {isCustomActive && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onTimeFilterChange('all');
                    }}
                    className="p-0.5 rounded-full hover:bg-emerald-500/30 text-emerald-400 ml-1"
                    title="Clear Custom Range"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>

              {/* Date Range Popover */}
              <DateRangePicker
                customRange={customRange}
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onRangeChange={(range) => {
                  onCustomRangeChange(range);
                  onTimeFilterChange('custom');
                }}
              />
            </div>
          </div>

          {/* Include Warmup Toggle */}
          <button
            onClick={onToggleWarmup}
            title="เปิด/ปิด การนับรวมเซ็ต Warmup ใน Volume และจำนวนเซ็ต"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              includeWarmup
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Warmups: {includeWarmup ? 'On' : 'Off'}</span>
          </button>

          {/* Sync Hevy Button */}
          <button
            onClick={onSyncHevy}
            disabled={isSyncing}
            title="ซิงค์ข้อมูล workout ล่าสุดจาก Hevy API เข้า workout_data.csv โดยตรง"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSyncing
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 cursor-wait animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-glow-emerald hover:text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-amber-400' : 'text-emerald-400 fill-emerald-400/20'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Hevy'}</span>
          </button>

          {/* Upload CSV Dropdown/Actions */}
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              accept=".csv"
              ref={workoutInputRef}
              onChange={handleWorkoutFile}
              className="hidden"
            />
            <input
              type="file"
              accept=".csv"
              ref={measurementInputRef}
              onChange={handleMeasurementFile}
              className="hidden"
            />

            <button
              onClick={() => workoutInputRef.current?.click()}
              title="Upload workout_data.csv ใหม่"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-zinc-900 text-zinc-300 border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workout CSV</span>
            </button>

            <button
              onClick={() => measurementInputRef.current?.click()}
              title="Upload measurement_data.csv ใหม่"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-zinc-900 text-zinc-300 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Body CSV</span>
            </button>

            <button
              onClick={onResetDefaultData}
              title="Reset เป็นไฟล์เริ่มต้นจาก /raw"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-white/10 transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-1 border-l border-white/10">
              <div
                title={user.email || 'ผู้ใช้งาน'}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-300 max-w-[170px]"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="avatar"
                    className="w-4 h-4 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="truncate text-[11px] font-mono">{user.email}</span>
              </div>

              <button
                onClick={() => signOut()}
                title="ออกจากระบบ (Sign Out)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-zinc-900 text-zinc-400 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 border border-white/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Info Badge if in custom mode */}
      {isCustomActive && (
        <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-emerald-300">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>
              Active Date Window: <strong className="font-mono text-white">{customRange.startDate}</strong> to <strong className="font-mono text-white">{customRange.endDate}</strong>
            </span>
          </div>
          <button
            onClick={() => onTimeFilterChange('all')}
            className="text-zinc-400 hover:text-white underline font-mono text-[11px]"
          >
            Reset to All Time
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-3.5 flex items-center gap-2 border-t border-white/5 pt-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
