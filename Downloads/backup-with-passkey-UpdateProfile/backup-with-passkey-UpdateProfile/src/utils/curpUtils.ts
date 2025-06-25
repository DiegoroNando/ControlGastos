// utils/curpUtils.ts
import { CURP_REGEX } from '../constants';

/**
 * Validates a Mexican CURP string using the standard CURP format regex.
 * @param curp The CURP string to validate.
 * @returns True if the CURP is valid, false otherwise.
 */
export const validateCURP = (curp: string): boolean => {
  if (typeof curp !== 'string') {
    return false;
  }
  
  const cleanCurp = curp.trim().toUpperCase();
  return CURP_REGEX.test(cleanCurp);
};

/**
 * Extracts the date of birth from a Mexican CURP string.
 * CURP structure relevant for date: XXXXYYMMDD...
 *                                    ^456789
 * The character at index 16 (17th char) is used to differentiate century:
 * - A letter (A-Z) typically indicates a birth year in the 2000s (20xx).
 * - A digit (0-9) typically indicates a birth year in the 1900s (19xx).
 *
 * @param curp The CURP string (18 characters).
 * @returns The date of birth in "YYYY-MM-DD" format, or null if extraction fails or CURP is invalid.
 */
export const extractDateOfBirthFromCURP = (curp: string): string | null => {
  if (typeof curp !== 'string' || curp.length !== 18) {
    return null; // CURP must be 18 characters long
  }

  const yearStr = curp.substring(4, 6);
  const monthStr = curp.substring(6, 8);
  const dayStr = curp.substring(8, 10);
  const differentiatorChar = curp.charAt(16); // Character at index 16 (17th position)

  if (!/^\d{2}$/.test(yearStr) || !/^\d{2}$/.test(monthStr) || !/^\d{2}$/.test(dayStr)) {
    return null; // Date parts are not two digits or not numeric
  }

  const yearYY = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null; // Invalid month or day range
  }

  let centuryPrefix: number;
  if (/[A-Z]/.test(differentiatorChar)) { // If it's a letter (A-Z)
    centuryPrefix = 2000;
  } else if (/\d/.test(differentiatorChar)) { // If it's a digit (0-9)
    centuryPrefix = 1900;
  } else {
    // Should not happen if CURP regex is enforced, but as a fallback.
    // This case might imply an invalid differentiator character.
    // A more complex heuristic could be applied here if needed,
    // but standard CURPs should have a letter or digit.
    // For safety, returning null if differentiator is neither.
    return null; 
  }

  const resolvedYear = centuryPrefix + yearYY;

  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');

  // Validate the constructed date (e.g., to catch Feb 30)
  const dateObj = new Date(resolvedYear, month - 1, day); // month is 0-indexed in Date constructor
  
  if (
    dateObj.getFullYear() !== resolvedYear ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return null; // The date is invalid (e.g., February 30th)
  }

  // Optional: Add a check to ensure the resolved year is not too far in the past or future
  const currentYear = new Date().getFullYear();
  if (resolvedYear < 1900 || resolvedYear > currentYear + 5) { // Allowing a small buffer for future dates if system allows pre-registration
    // This might indicate an issue or a very old/future CURP date.
    // Depending on requirements, this check can be adjusted or removed.
    // For now, it's a basic sanity check.
  }

  return `${resolvedYear}-${formattedMonth}-${formattedDay}`;
};
