/**
 * Utility functions for extracting and parsing semantic date terms from user input
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SeasonDates {
  [key: string]: {
    start: { month: number; day: number };
    end: { month: number; day: number };
  };
}

// Define seasonal date ranges (Northern Hemisphere)
const SEASON_DATES: SeasonDates = {
  spring: { start: { month: 2, day: 20 }, end: { month: 5, day: 20 } }, // March 20 - June 20
  summer: { start: { month: 5, day: 21 }, end: { month: 8, day: 22 } }, // June 21 - September 22
  fall: { start: { month: 8, day: 23 }, end: { month: 11, day: 20 } }, // September 23 - December 20
  autumn: { start: { month: 8, day: 23 }, end: { month: 11, day: 20 } }, // September 23 - December 20
  winter: { start: { month: 11, day: 21 }, end: { month: 2, day: 19 } }, // December 21 - March 19
};

// Common holidays with approximate dates
const HOLIDAY_DATES: { [key: string]: { month: number; day: number; duration?: number } } = {
  'new year': { month: 0, day: 1, duration: 3 },
  'new years': { month: 0, day: 1, duration: 3 },
  'valentine': { month: 1, day: 14, duration: 1 },
  'valentines': { month: 1, day: 14, duration: 1 },
  'easter': { month: 3, day: 15, duration: 4 }, // Approximate, varies by year
  'memorial day': { month: 4, day: 25, duration: 3 }, // Last Monday in May
  'independence day': { month: 6, day: 4, duration: 1 },
  'july 4th': { month: 6, day: 4, duration: 1 },
  '4th of july': { month: 6, day: 4, duration: 1 },
  'labor day': { month: 8, day: 1, duration: 3 }, // First Monday in September
  'halloween': { month: 9, day: 31, duration: 1 },
  'thanksgiving': { month: 10, day: 25, duration: 4 }, // Fourth Thursday in November
  'christmas': { month: 11, day: 25, duration: 7 },
  'xmas': { month: 11, day: 25, duration: 7 },
  'new year\'s eve': { month: 11, day: 31, duration: 1 },
  'nye': { month: 11, day: 31, duration: 1 },
};

// Month names mapping
const MONTH_NAMES: { [key: string]: number } = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Extract date-related terms from user input text
 */
export function extractDateTermsFromText(text: string): string[] {
  if (!text) return [];
  
  const lowered = text.toLowerCase();
  const dateTerms: string[] = [];
  
  // Check for seasons
  Object.keys(SEASON_DATES).forEach(season => {
    if (lowered.includes(season)) {
      dateTerms.push(season);
    }
  });
  
  // Check for holidays
  Object.keys(HOLIDAY_DATES).forEach(holiday => {
    if (lowered.includes(holiday)) {
      dateTerms.push(holiday);
    }
  });
  
  // Check for months
  Object.keys(MONTH_NAMES).forEach(month => {
    const regex = new RegExp(`\\b${month}\\b`, 'i');
    if (regex.test(lowered)) {
      dateTerms.push(month);
    }
  });
  
  // Check for relative time terms
  const relativeTerms = [
    'this week', 'next week', 'this weekend', 'next weekend',
    'this month', 'next month', 'this year', 'next year',
    'today', 'tomorrow', 'next week'
  ];
  
  relativeTerms.forEach(term => {
    if (lowered.includes(term)) {
      dateTerms.push(term);
    }
  });
  
  return dateTerms;
}

/**
 * Convert a season name to date range for the current or next occurrence
 */
export function getSeasonDateRange(season: string, year?: number): DateRange | null {
  const seasonKey = season.toLowerCase();
  const seasonData = SEASON_DATES[seasonKey];
  
  if (!seasonData) return null;
  
  const currentYear = year || new Date().getFullYear();
  const currentDate = new Date();
  
  // Handle winter season that spans across years
  if (seasonKey === 'winter') {
    const winterStart = new Date(currentYear, seasonData.start.month, seasonData.start.day);
    const winterEnd = new Date(currentYear + 1, seasonData.end.month, seasonData.end.day);
    
    // If we're past winter start or before winter end of current year
    if (currentDate >= winterStart || currentDate <= new Date(currentYear, seasonData.end.month, seasonData.end.day)) {
      return {
        startDate: winterStart,
        endDate: winterEnd
      };
    } else {
      // Next winter
      return {
        startDate: new Date(currentYear + 1, seasonData.start.month, seasonData.start.day),
        endDate: new Date(currentYear + 2, seasonData.end.month, seasonData.end.day)
      };
    }
  }
  
  // For other seasons
  const seasonStart = new Date(currentYear, seasonData.start.month, seasonData.start.day);
  const seasonEnd = new Date(currentYear, seasonData.end.month, seasonData.end.day);
  
  // If season has passed this year, use next year
  if (currentDate > seasonEnd) {
    return {
      startDate: new Date(currentYear + 1, seasonData.start.month, seasonData.start.day),
      endDate: new Date(currentYear + 1, seasonData.end.month, seasonData.end.day)
    };
  }
  
  return {
    startDate: seasonStart,
    endDate: seasonEnd
  };
}

/**
 * Convert a holiday name to date range
 */
export function getHolidayDateRange(holiday: string, year?: number): DateRange | null {
  const holidayKey = holiday.toLowerCase();
  const holidayData = HOLIDAY_DATES[holidayKey];
  
  if (!holidayData) return null;
  
  const currentYear = year || new Date().getFullYear();
  const currentDate = new Date();
  
  const holidayDate = new Date(currentYear, holidayData.month, holidayData.day);
  const duration = holidayData.duration || 1;
  
  // If holiday has passed this year, use next year
  if (currentDate > holidayDate) {
    const nextYearHoliday = new Date(currentYear + 1, holidayData.month, holidayData.day);
    return {
      startDate: nextYearHoliday,
      endDate: new Date(nextYearHoliday.getTime() + (duration - 1) * 24 * 60 * 60 * 1000)
    };
  }
  
  return {
    startDate: holidayDate,
    endDate: new Date(holidayDate.getTime() + (duration - 1) * 24 * 60 * 60 * 1000)
  };
}

/**
 * Convert a month name to date range for the current or next occurrence
 */
export function getMonthDateRange(month: string, year?: number): DateRange | null {
  const monthKey = month.toLowerCase();
  const monthNumber = MONTH_NAMES[monthKey];
  
  if (monthNumber === undefined) return null;
  
  const currentYear = year || new Date().getFullYear();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Determine which year to use
  let targetYear = currentYear;
  if (monthNumber < currentMonth || (monthNumber === currentMonth && currentDate.getDate() > 15)) {
    targetYear = currentYear + 1;
  }
  
  const startDate = new Date(targetYear, monthNumber, 1);
  const endDate = new Date(targetYear, monthNumber + 1, 0); // Last day of the month
  
  return {
    startDate,
    endDate
  };
}

/**
 * Convert relative time terms to date ranges
 */
export function getRelativeDateRange(term: string): DateRange | null {
  const currentDate = new Date();
  const termLower = term.toLowerCase();
  
  switch (termLower) {
    case 'today':
      return {
        startDate: new Date(currentDate),
        endDate: new Date(currentDate)
      };
      
    case 'tomorrow':
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        startDate: tomorrow,
        endDate: tomorrow
      };
      
    case 'this week':
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        startDate: startOfWeek,
        endDate: endOfWeek
      };
      
    case 'next week':
      const nextWeekStart = new Date(currentDate);
      nextWeekStart.setDate(currentDate.getDate() + (7 - currentDate.getDay()));
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      return {
        startDate: nextWeekStart,
        endDate: nextWeekEnd
      };
      
    case 'this weekend':
      const thisSaturday = new Date(currentDate);
      thisSaturday.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
      const thisSunday = new Date(thisSaturday);
      thisSunday.setDate(thisSaturday.getDate() + 1);
      return {
        startDate: thisSaturday,
        endDate: thisSunday
      };
      
    case 'next weekend':
      const nextSaturday = new Date(currentDate);
      nextSaturday.setDate(currentDate.getDate() + (13 - currentDate.getDay()));
      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      return {
        startDate: nextSaturday,
        endDate: nextSunday
      };
      
    case 'this month':
      const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const thisMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return {
        startDate: thisMonthStart,
        endDate: thisMonthEnd
      };
      
    case 'next month':
      const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const nextMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      return {
        startDate: nextMonthStart,
        endDate: nextMonthEnd
      };
      
    default:
      return null;
  }
}

/**
 * Main function to extract and convert semantic date terms to actual date ranges
 */
export function parseSemanticDates(text: string): DateRange | null {
  const dateTerms = extractDateTermsFromText(text);
  
  if (dateTerms.length === 0) return null;
  
  // Prioritize the first found term (could be enhanced to handle multiple terms)
  const primaryTerm = dateTerms[0];
  
  // Try different parsing methods
  let dateRange = getSeasonDateRange(primaryTerm);
  if (dateRange) return dateRange;
  
  dateRange = getHolidayDateRange(primaryTerm);
  if (dateRange) return dateRange;
  
  dateRange = getMonthDateRange(primaryTerm);
  if (dateRange) return dateRange;
  
  dateRange = getRelativeDateRange(primaryTerm);
  if (dateRange) return dateRange;
  
  return null;
}

/**
 * Check if text contains semantic date terms
 */
export function hasSemanticDateTerms(text: string): boolean {
  return extractDateTermsFromText(text).length > 0;
}
