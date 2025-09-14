import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { EventIdea } from '../types';

interface CalendarViewProps {
  events: EventIdea[];
  sessionStartDate?: Date;
  sessionEndDate?: Date;
}

export function CalendarView({ events, sessionStartDate, sessionEndDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Auto-navigate to session start date when component mounts or session dates change
  useEffect(() => {
    if (sessionStartDate) {
      setCurrentDate(new Date(sessionStartDate.getFullYear(), sessionStartDate.getMonth(), 1));
    }
  }, [sessionStartDate]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventsForDay = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Event Calendar</h3>
          </div>
          <div className="flex items-center space-x-4">
            <h4 className="text-lg font-medium text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Legend for session dates */}
        {(sessionStartDate || sessionEndDate) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Session Timeline</h4>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-gray-600">Session period</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border-2 border-green-400 rounded"></div>
                  <span className="text-gray-600">Start/End dates</span>
                </div>
              </div>
            </div>
            {sessionStartDate && sessionEndDate && (
              <p className="text-sm text-gray-600 mt-1">
                {sessionStartDate.toLocaleDateString()} - {sessionEndDate.toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map(day => (
            <div key={`empty-${day}`} className="p-2 h-24"></div>
          ))}
          
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === dayDate.toDateString();
            
            // Check if this day is within the session date range
            const isInSessionRange = sessionStartDate && sessionEndDate && 
              dayDate >= sessionStartDate && dayDate <= sessionEndDate;
            const isSessionStart = sessionStartDate && 
              dayDate.toDateString() === sessionStartDate.toDateString();
            const isSessionEnd = sessionEndDate && 
              dayDate.toDateString() === sessionEndDate.toDateString();
            
            let dayClasses = 'p-2 h-24 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors';
            let dayNumberClasses = 'text-sm font-medium mb-1';
            
            if (isToday) {
              dayClasses += ' bg-blue-50 border-blue-200';
              dayNumberClasses += ' text-blue-600';
            } else if (isInSessionRange) {
              dayClasses += ' bg-green-50 border-green-200';
              dayNumberClasses += ' text-green-700';
            } else {
              dayNumberClasses += ' text-gray-900';
            }
            
            if (isSessionStart || isSessionEnd) {
              dayClasses += ' ring-2 ring-green-400';
            }
            
            return (
              <div key={day} className={dayClasses}>
                <div className={dayNumberClasses}>
                  {day}
                  {isSessionStart && (
                    <span className="ml-1 text-xs text-green-600 font-semibold">Start</span>
                  )}
                  {isSessionEnd && sessionStartDate && sessionEndDate && 
                   sessionStartDate.toDateString() !== sessionEndDate.toDateString() && (
                    <span className="ml-1 text-xs text-green-600 font-semibold">End</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No events scheduled yet</p>
          <p className="text-sm">Start adding ideas to see them on the calendar!</p>
        </div>
      )}
    </div>
  );
}
