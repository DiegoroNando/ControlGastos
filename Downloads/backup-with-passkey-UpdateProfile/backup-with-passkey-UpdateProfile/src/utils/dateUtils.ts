// utils/dateUtils.ts

/**
 * Checks if a given Date object is a business day (Monday-Friday).
 * Uses UTC methods to remain consistent with ISO string conversions.
 * @param date The Date object to check.
 * @returns True if the date is a business day, false otherwise.
 */
export const isBusinessDay = (date: Date): boolean => {
  const day = date.getUTCDay(); // 0 (Sunday) to 6 (Saturday)
  return day >= 1 && day <= 5; // Monday to Friday
};

/**
 * Converts a "YYYY-MM-DD" ISO string to a Date object at UTC midnight.
 * @param isoDate The ISO date string.
 * @returns Date object.
 */
export const isoToDateUTC = (isoDate: string): Date => {
    if (!isoDate) return new Date(NaN); // Return an invalid date if input is empty
    return new Date(isoDate + 'T00:00:00.000Z');
};

/**
 * Converts a Date object to a "YYYY-MM-DD" ISO string, using UTC values.
 * @param date The Date object.
 * @returns ISO date string "YYYY-MM-DD".
 */
export const dateToIsoUTC = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return ''; // Return empty if date is invalid
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
};

/**
 * Finds the next business day from a given Date object.
 * If the input date is already a business day, it returns the same date.
 * @param date The starting Date object.
 * @returns A new Date object representing the next business day.
 */
export const findNextBusinessDay = (date: Date): Date => {
  const newDate = new Date(date.valueOf()); // Clone the date
  while (!isBusinessDay(newDate)) {
    newDate.setUTCDate(newDate.getUTCDate() + 1);
  }
  return newDate;
};

/**
 * Adds a specified number of business days to a start date.
 * The start date itself is counted as the first day if it's a business day.
 * For example:
 * - Start Mon, Duration 1 day -> End Mon
 * - Start Mon, Duration 3 days -> End Wed
 * - Start Fri, Duration 2 days -> End next Mon (Fri is day 1, Mon is day 2)
 * @param startDateIso The starting date in "YYYY-MM-DD" format.
 * @param duration The number of business days for the period (must be >= 1).
 * @returns The end date in "YYYY-MM-DD" format. Returns empty string if inputs are invalid.
 */
export const addBusinessDays = (startDateIso: string, duration: number): string => {
  if (!startDateIso || isNaN(duration) || duration < 1) {
    // console.warn("addBusinessDays: Invalid input", { startDateIso, duration });
    return ''; 
  }

  let currentDate = isoToDateUTC(startDateIso);
  if (isNaN(currentDate.getTime())) return ''; // Invalid start date string

  // Adjust start date to the current or next business day if it's a weekend.
  // This function assumes the provided startDateIso is the intended start.
  // If it's a weekend, the period effectively starts on the next business day.
  currentDate = findNextBusinessDay(currentDate);

  let businessDaysElapsed = 0;
  let resultDate = new Date(currentDate.valueOf()); // Start with the (potentially adjusted) start date

  while (businessDaysElapsed < duration) {
    if (isBusinessDay(resultDate)) {
      businessDaysElapsed++;
    }
    if (businessDaysElapsed < duration) {
      resultDate.setUTCDate(resultDate.getUTCDate() + 1);
      // Skip weekends for subsequent days
      while (!isBusinessDay(resultDate) && businessDaysElapsed < duration) {
         resultDate.setUTCDate(resultDate.getUTCDate() + 1);
      }
    }
  }
  return dateToIsoUTC(resultDate);
};


/**
 * Counts the number of business days between two ISO date strings (inclusive).
 * @param startDateIso Start date in "YYYY-MM-DD".
 * @param endDateIso End date in "YYYY-MM-DD".
 * @returns Number of business days. Returns 0 if dates are invalid or start is after end.
 */
export const countBusinessDays = (startDateIso: string, endDateIso: string): number => {
  if (!startDateIso || !endDateIso) return 0;
  
  let startDate = isoToDateUTC(startDateIso);
  const endDate = isoToDateUTC(endDateIso);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) return 0;

  let count = 0;
  const currentDate = new Date(startDate.valueOf());

  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return count;
};
