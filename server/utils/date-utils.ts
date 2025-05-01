/**
 * Date utility functions for handling timezone issues with Indian dates
 * 
 * The application has a persistent issue with dates, especially with the format
 * YYYY-MM-DDT18:30:00+00:00 which represents a date in Indian time (UTC+5:30).
 * This utility provides standardized functions to handle these date conversions.
 */

/**
 * Normalizes any date input to standard YYYY-MM-DD format
 * This is the most reliable format for our application as it avoids timezone issues
 * 
 * @param dateValue - Any date value (string, Date object, or null)
 * @returns Normalized date string in YYYY-MM-DD format or null if invalid
 */
export function normalizeDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  try {
    // Special case: T18:30:00 UTC format (Indian date format issue)
    if (typeof dateValue === 'string' && dateValue.includes('T18:30:00')) {
      // This specific time corresponds to midnight in India (UTC+5:30)
      console.log('UTIL: Normalizing special Indian date format:', dateValue);
      const datePart = dateValue.split('T')[0];
      const [year, month, day] = datePart.split('-').map(num => parseInt(num));
      
      // Add one day to account for Indian timezone (UTC+5:30)
      const correctedDate = new Date(year, month-1, day+1, 12, 0, 0);
      
      return correctedDate.toISOString().split('T')[0];
    }
    
    // Standard case: any other date format
    let dateObj;
    if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else {
      dateObj = new Date(dateValue);
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn('UTIL: Invalid date detected:', dateValue);
      return null;
    }
    
    // Always return just the date part in YYYY-MM-DD format
    return dateObj.toISOString().split('T')[0];
  } catch (err) {
    console.error('UTIL: Error normalizing date:', err);
    return null;
  }
}

/**
 * Detects if a date is in the problematic Indian format
 * 
 * @param dateValue - Any date value (string, Date object, or null)
 * @returns boolean indicating if this is a problematic Indian date
 */
export function isIndianDateFormat(dateValue: any): boolean {
  if (!dateValue || typeof dateValue !== 'string') return false;
  
  return dateValue.includes('T18:30:00') || 
         (dateValue.includes('T18:30:00') && dateValue.includes('+00:00'));
}

/**
 * Formats a date for display to the user (for UI purposes)
 * 
 * @param dateValue - Any date value (string, Date object, or null)
 * @returns User-friendly date string or empty string if invalid
 */
export function formatDateForDisplay(dateValue: any): string {
  if (!dateValue) return '';
  
  try {
    const normalizedDate = normalizeDate(dateValue);
    if (!normalizedDate) return '';
    
    // Parse the normalized date (which is YYYY-MM-DD format)
    const [year, month, day] = normalizedDate.split('-').map(Number);
    
    // Format as DD-MM-YYYY for Indian locale
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
  } catch (err) {
    console.error('UTIL: Error formatting date for display:', err);
    return '';
  }
}
