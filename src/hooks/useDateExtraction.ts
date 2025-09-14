import { useCallback } from 'react';
import { parseSemanticDates, hasSemanticDateTerms, extractDateTermsFromText } from '../utils/dateExtraction';
import type { DateRange } from '../utils/dateExtraction';

export function useDateExtraction() {
  /**
   * Extract semantic date terms from user input text
   */
  const extractDateFromIdea = useCallback((text: string): DateRange | null => {
    if (!text) return null;
    return parseSemanticDates(text);
  }, []);

  /**
   * Check if the text contains any semantic date terms
   */
  const hasDateTerms = useCallback((text: string): boolean => {
    return hasSemanticDateTerms(text);
  }, []);

  /**
   * Get all date terms found in the text
   */
  const getDateTerms = useCallback((text: string): string[] => {
    return extractDateTermsFromText(text);
  }, []);

  /**
   * Extract and apply date range from text to date change handler
   */
  const applySemanticDates = useCallback((
    text: string,
    onDateChange: (startDate?: Date, endDate?: Date) => void
  ): boolean => {
    const dateRange = extractDateFromIdea(text);
    if (dateRange) {
      onDateChange(dateRange.startDate, dateRange.endDate);
      return true;
    }
    return false;
  }, [extractDateFromIdea]);

  return {
    extractDateFromIdea,
    hasDateTerms,
    getDateTerms,
    applySemanticDates
  };
}
