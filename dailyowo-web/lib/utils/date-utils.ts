
import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a Firestore Timestamp, a string, or a Date object into a JavaScript Date object.
 * @param dateInput The date value to convert.
 * @returns A valid Date object or null if the input is invalid.
 */
export function safeToDate(dateInput: any): Date | null {
  if (!dateInput) {
    return null;
  }
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (dateInput instanceof Timestamp) {
    return dateInput.toDate();
  }
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}
