"use client";

import { addDays } from "@/lib/dateUtils";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  min,
  max,
}: DateRangePickerProps) {
  const applyPreset = (daysBack: number) => {
    const end = max ?? new Date().toISOString().slice(0, 10);
    onEndDateChange(end);
    onStartDateChange(addDays(end, -daysBack));
  };

  const applyFromFeb28 = () => {
    const today = new Date().toISOString().slice(0, 10);
    const end = max ?? today;
    const year = new Date().getFullYear();
    const feb28 = `${year}-02-28`;
    const start = feb28 <= end ? feb28 : `${year - 1}-02-28`;
    onEndDateChange(end);
    onStartDateChange(start);
  };

  const btn =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-600 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Quick select:</span>
        <button type="button" onClick={applyFromFeb28} className={btn}>
          Since Feb 28
        </button>
        <button type="button" onClick={() => applyPreset(7)} className={btn}>
          Last 7 days
        </button>
        <button type="button" onClick={() => applyPreset(30)} className={btn}>
          Last 30 days
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={min}
            max={endDate || max}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors duration-200 focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate || min}
            max={max}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors duration-200 focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      </div>
    </div>
  );
}
