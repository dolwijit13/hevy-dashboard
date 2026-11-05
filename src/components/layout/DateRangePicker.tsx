import React, { useState, useRef, useEffect } from 'react';
import { CustomDateRange } from '../../types/fitness';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface DateRangePickerProps {
  customRange: CustomDateRange;
  onRangeChange: (range: CustomDateRange) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  customRange,
  onRangeChange,
  isOpen,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const [selectedStart, setSelectedStart] = useState<string>(customRange.startDate);
  const [selectedEnd, setSelectedEnd] = useState<string>(customRange.endDate);

  const initialYear = parseInt(selectedStart.split('-')[0], 10) || 2025;
  const initialMonth = (parseInt(selectedStart.split('-')[1], 10) || 1) - 1;
  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedStart(customRange.startDate);
    setSelectedEnd(customRange.endDate);
  }, [customRange]);

  if (!isOpen) return null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const d90Str = `${d90.getFullYear()}-${String(d90.getMonth() + 1).padStart(2, '0')}-${String(d90.getDate()).padStart(2, '0')}`;
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d30Str = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;
  const currentYear = now.getFullYear();

  const availableYears = [2023, 2024, 2025, 2026];

  const presets = [
    { label: `All Time (2023 - ${currentYear})`, start: '2023-01-27', end: todayStr },
    { label: `Year to Date (${currentYear})`, start: `${currentYear}-01-01`, end: todayStr },
    { label: 'Last Year (2025)', start: '2025-01-01', end: '2025-12-31' },
    { label: 'Year 2024', start: '2024-01-01', end: '2024-12-31' },
    { label: 'Year 2023', start: '2023-01-27', end: '2023-12-31' },
    { label: 'Last 90 Days', start: d90Str, end: todayStr },
    { label: 'Last 30 Days', start: d30Str, end: todayStr },
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > 2023) {
        setViewYear(viewYear - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < 2026) {
        setViewYear(viewYear + 1);
        setViewMonth(0);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDateClick = (dateStr: string) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(dateStr);
      setSelectedEnd('');
    } else if (selectedStart && !selectedEnd) {
      if (dateStr < selectedStart) {
        setSelectedStart(dateStr);
        setSelectedEnd(selectedStart);
      } else {
        setSelectedEnd(dateStr);
      }
    }
  };

  const handleApply = () => {
    const finalStart = selectedStart || '2023-01-27';
    const finalEnd = selectedEnd || selectedStart || '2026-09-15';
    onRangeChange({
      startDate: finalStart <= finalEnd ? finalStart : finalEnd,
      endDate: finalStart <= finalEnd ? finalEnd : finalStart,
    });
    onClose();
  };

  const handlePresetClick = (start: string, end: string) => {
    setSelectedStart(start);
    setSelectedEnd(end);
    const yr = parseInt(start.split('-')[0], 10);
    const mo = parseInt(start.split('-')[1], 10) - 1;
    setViewYear(yr);
    setViewMonth(mo);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full mt-2 right-0 z-50 w-full sm:w-[620px] bg-[#121216] border border-white/15 rounded-2xl shadow-2xl p-5 backdrop-blur-2xl text-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-white text-sm">Select Custom Date Range</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Quick Presets */}
        <div className="sm:col-span-4 space-y-1.5 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold px-2 block mb-1">
            Quick Presets
          </span>
          {presets.map((p) => {
            const isMatch = selectedStart === p.start && selectedEnd === p.end;
            return (
              <button
                key={p.label}
                onClick={() => handlePresetClick(p.start, p.end)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-all flex items-center justify-between ${
                  isMatch
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{p.label}</span>
                {isMatch && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Interactive Month/Year Jump & Calendar Days */}
        <div className="sm:col-span-8 flex flex-col justify-between">
          <div>
            {/* Direct Jump Controls */}
            <div className="flex items-center justify-between gap-2 mb-3 bg-zinc-900/80 p-2 rounded-xl border border-white/5">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="bg-zinc-800 text-zinc-200 font-medium px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="bg-zinc-800 text-zinc-200 font-mono font-medium px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-zinc-500 mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-7 h-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const dateStr = `${viewYear}-${mStr}-${dStr}`;

                const isStart = dateStr === selectedStart;
                const isEnd = dateStr === selectedEnd;
                const inRange =
                  selectedStart && selectedEnd && dateStr > selectedStart && dateStr < selectedEnd;

                let cellClass =
                  'w-7 h-7 mx-auto flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all select-none ';

                if (isStart || isEnd) {
                  cellClass +=
                    'bg-emerald-500 text-black font-extrabold shadow-glow-emerald rounded-lg z-10';
                } else if (inRange) {
                  cellClass +=
                    'bg-emerald-500/20 text-emerald-300 rounded-none border-y border-emerald-500/30';
                } else {
                  cellClass += 'text-zinc-300 hover:bg-zinc-800 hover:text-white';
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDateClick(dateStr)}
                    className={cellClass}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Range Display & Action Buttons */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
              <span className="text-zinc-500">Range:</span>
              <strong className="text-emerald-400">{selectedStart || 'Select Start'}</strong>
              <span>→</span>
              <strong className="text-cyan-400">
                {selectedEnd || (selectedStart ? 'Select End' : '...')}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-glow-emerald flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Range</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
