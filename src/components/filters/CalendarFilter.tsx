import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import DateRangeCalendar from '../DateRangeCalendar';
import { FilterPopover } from './FilterPopover';
import { usePopoverManager } from '../../hooks/usePopoverManager';

interface CalendarFilterProps {
  selectedStartDate?: Date;
  selectedEndDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
}

export function CalendarFilter({ 
  selectedStartDate, 
  selectedEndDate, 
  onDateChange, 
  className = '' 
}: CalendarFilterProps) {
  const { isOpen, toggle, close, popoverRef, buttonRef } = usePopoverManager();
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const hasSelection = selectedStartDate || selectedEndDate;

  const handleDateSelect = (date: Date) => {
    if (calendarMode === 'single') {
      onDateChange(date, undefined);
    } else {
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        onDateChange(date, undefined);
      } else if (selectedStartDate && !selectedEndDate) {
        if (date < selectedStartDate) {
          onDateChange(date, selectedStartDate);
        } else {
          onDateChange(selectedStartDate, date);
        }
      }
    }
  };

  const handleModeChange = (mode: 'single' | 'range') => {
    setCalendarMode(mode);
    // Reset range when switching modes for clarity
    if (mode === 'single') {
      onDateChange(selectedStartDate, undefined);
    }
  };

  const handleClear = () => {
    onDateChange(undefined, undefined);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${
          hasSelection || isOpen ? 'text-blue-400' : ''
        } ${className}`}
        title="Add date"
        aria-label="Add date"
        onClick={toggle}
      >
        <Calendar className="w-4 h-4" />
      </button>

      <FilterPopover isOpen={isOpen} popoverRef={popoverRef} className="left-2">
        <DateRangeCalendar
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          mode={calendarMode}
          onModeChange={handleModeChange}
          startDate={selectedStartDate}
          endDate={selectedEndDate}
          onSelectDate={handleDateSelect}
          className="w-[220px] md:w-[240px]"
          onApply={close}
          onClear={handleClear}
        />
      </FilterPopover>
    </div>
  );
}
