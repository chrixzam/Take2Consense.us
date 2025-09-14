import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type Mode = 'single' | 'range';

export interface DateRangeCalendarProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  startDate?: Date;
  endDate?: Date;
  onSelectDate: (d: Date) => void;
  onApply?: () => void;
  onClear?: () => void;
  className?: string;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, 1);
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const isSameDay = (a?: Date, b?: Date) => !!a && !!b && a.toDateString() === b.toDateString();
const isBetween = (d: Date, a?: Date, b?: Date) => (a && b ? d >= stripTime(a) && d <= stripTime(b) : false);
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DateRangeCalendar({
  month,
  onMonthChange,
  mode,
  onModeChange,
  startDate,
  endDate,
  onSelectDate,
  onApply,
  onClear,
  className,
}: DateRangeCalendarProps) {
  const first = startOfMonth(month);
  const firstWeekday = first.getDay();
  const totalDays = daysInMonth(month);

  // Build a 6x7 grid including previous/next month fillers
  const grid: { date: Date; inMonth: boolean }[] = [];
  // previous month fillers
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(month.getFullYear(), month.getMonth(), -firstWeekday + i + 1);
    grid.push({ date: d, inMonth: false });
  }
  // current month
  for (let i = 1; i <= totalDays; i++) {
    grid.push({ date: new Date(month.getFullYear(), month.getMonth(), i), inMonth: true });
  }
  // next month fillers
  while (grid.length % 7 !== 0) {
    const last = grid[grid.length - 1].date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    grid.push({ date: d, inMonth: false });
  }
  while (grid.length < 42) {
    const last = grid[grid.length - 1].date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    grid.push({ date: d, inMonth: false });
  }

  return (
    <div className={(className ?? 'w-[240px]') + ' rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl text-gray-100'}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-medium">
            {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded-md hover:bg-white/10"
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Previous month"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded-md hover:bg-white/10"
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Next month"
            type="button"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="px-3 pt-3">
        <div className="inline-flex items-center rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => onModeChange('single')}
            className={
              'px-2 py-1 text-xs rounded-md transition-colors ' +
              (mode === 'single' ? 'bg-emerald-500/20 text-emerald-200' : 'text-gray-300 hover:text-white')
            }
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => onModeChange('range')}
            className={
              'px-2 py-1 text-xs rounded-md transition-colors ' +
              (mode === 'range' ? 'bg-emerald-500/20 text-emerald-200' : 'text-gray-300 hover:text-white')
            }
          >
            Range
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-[10px] text-gray-400">
        {weekdayLabels.map((d) => (
          <div key={d} className="text-center py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-2">
        {grid.map(({ date, inMonth }, idx) => {
          const d = stripTime(date);
          const selectedStart = startDate ? stripTime(startDate) : undefined;
          const selectedEnd = endDate ? stripTime(endDate) : undefined;

          const isStart = isSameDay(d, selectedStart);
          const isEnd = isSameDay(d, selectedEnd);
          const inSelectedRange = isBetween(d, selectedStart, selectedEnd);

          // Render placeholders for days outside the current month (blank cells)
          if (!inMonth) {
            return <div key={idx} className="py-1.5" />;
          }

          const base = 'relative text-xs text-center py-1.5 select-none text-gray-200';
          const rangeBg = inSelectedRange ? ' bg-emerald-500/10' : '';
          const dayClasses = `${base}${rangeBg}`;

          let shape = '';
          if (mode === 'single' && isStart) {
            shape = ' bg-emerald-500/20 text-emerald-100 rounded-full';
          } else if (mode === 'range') {
            if (isStart && isEnd) {
              shape = ' bg-emerald-500/20 text-emerald-100 rounded-full';
            } else if (isStart) {
              shape = ' bg-emerald-500/20 text-emerald-100 rounded-l-full';
            } else if (isEnd) {
              shape = ' bg-emerald-500/20 text-emerald-100 rounded-r-full';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(d)}
              className={dayClasses + ' hover:bg-white/10 rounded-md transition-colors'}
              aria-label={d.toDateString()}
            >
              <span className={'relative z-10 px-2 py-1' + shape}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
        <div className="text-xs text-gray-300">
          {mode === 'single' && startDate && (
            <span>{startDate.toLocaleDateString()}</span>
          )}
          {mode === 'range' && startDate && !endDate && (
            <span>From {startDate.toLocaleDateString()}</span>
          )}
        {mode === 'range' && startDate && endDate && (
            <span>
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClear && (
            <button type="button" onClick={onClear} className="text-xs px-2 py-1 rounded-md text-gray-300 hover:text-white hover:bg-white/10">
              Clear
            </button>
          )}
          {onApply && (
            <button type="button" onClick={onApply} className="text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 ring-1 ring-emerald-400/30">
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
