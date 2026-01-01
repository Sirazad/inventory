import { TranslationKeys } from '../i18n/translations';

// Calendar constants
export const DAYS_PER_MONTH = 20;
export const MONTHS_PER_YEAR = 31;
export const DAYS_PER_YEAR = MONTHS_PER_YEAR * DAYS_PER_MONTH; // 620

// Calendar month interface
interface CalendarMonth {
  number: number;
  name: string;
  godName: string;
  godMonthNumber: number;
  season: string;
}

// Pyarr calendar months (31 months total)
const CALENDAR_MONTHS: CalendarMonth[] = [
  { number: 1, name: 'Szándék', godName: 'Kyel', godMonthNumber: 1, season: 'Hideg évszak' },
  { number: 2, name: 'Akarat', godName: 'Kyel', godMonthNumber: 2, season: 'Hideg évszak' },
  { number: 3, name: 'Harag', godName: 'Kyel', godMonthNumber: 3, season: 'Hideg évszak' },
  { number: 4, name: 'Csend', godName: 'Kyel', godMonthNumber: 4, season: 'Hideg évszak' },
  { number: 5, name: 'Lélek', godName: 'Darton', godMonthNumber: 1, season: 'Meleg évszak' },
  { number: 6, name: 'Ész', godName: 'Darton', godMonthNumber: 2, season: 'Meleg évszak' },
  { number: 7, name: 'Szív', godName: 'Darton', godMonthNumber: 3, season: 'Meleg évszak' },
  { number: 8, name: 'Bánat', godName: 'Darton', godMonthNumber: 4, season: 'Meleg évszak' },
  { number: 9, name: 'Fény', godName: 'Uwel', godMonthNumber: 1, season: 'Meleg évszak' },
  { number: 10, name: 'Árny', godName: 'Uwel', godMonthNumber: 2, season: 'Meleg évszak' },
  { number: 11, name: 'Kezdet', godName: 'Uwel', godMonthNumber: 3, season: 'Meleg évszak' },
  { number: 12, name: 'Vég', godName: 'Uwel', godMonthNumber: 4, season: 'Meleg évszak' },
  { number: 13, name: 'Dal', godName: 'Albourne', godMonthNumber: 1, season: 'Esős évszak' },
  { number: 14, name: 'Vers', godName: 'Albourne', godMonthNumber: 2, season: 'Esős évszak' },
  { number: 15, name: 'Mese', godName: 'Albourne', godMonthNumber: 3, season: 'Esős évszak' },
  { number: 16, name: 'Álom', godName: 'Albourne', godMonthNumber: 4, season: 'Esős évszak' },
  { number: 17, name: 'Múlt', godName: 'Adron', godMonthNumber: 1, season: 'Esős évszak' },
  { number: 18, name: 'Jelen', godName: 'Adron', godMonthNumber: 2, season: 'Esős évszak' },
  { number: 19, name: 'Jövő', godName: 'Adron', godMonthNumber: 3, season: 'Esős évszak' },
  { number: 20, name: 'Örökkévalóság', godName: 'Adron', godMonthNumber: 4, season: 'Esős évszak' },
  { number: 21, name: 'Tűz', godName: 'Krad', godMonthNumber: 1, season: 'Meleg évszak' },
  { number: 22, name: 'Víz', godName: 'Krad', godMonthNumber: 2, season: 'Meleg évszak' },
  { number: 23, name: 'Levegő', godName: 'Krad', godMonthNumber: 3, season: 'Meleg évszak' },
  { number: 24, name: 'Föld', godName: 'Krad', godMonthNumber: 4, season: 'Meleg évszak' },
  { number: 25, name: 'Élet', godName: 'Dreina', godMonthNumber: 1, season: 'Meleg évszak' },
  { number: 26, name: 'Halál', godName: 'Dreina', godMonthNumber: 2, season: 'Meleg évszak' },
  { number: 27, name: 'Újjászületés', godName: 'Dreina', godMonthNumber: 3, season: 'Meleg évszak' },
  { number: 28, name: 'Béke', godName: 'Antoh', godMonthNumber: 1, season: 'Hideg évszak' },
  { number: 29, name: 'Szerelem', godName: 'Antoh', godMonthNumber: 2, season: 'Hideg évszak' },
  { number: 30, name: 'Gyűlölet', godName: 'Antoh', godMonthNumber: 3, season: 'Hideg évszak' },
  { number: 31, name: 'Remény', godName: 'Arel', godMonthNumber: 1, season: 'Hideg évszak' },
];

// Create a Map for O(1) lookups by month number
const MONTHS_MAP = new Map<number, CalendarMonth>(
  CALENDAR_MONTHS.map(month => [month.number, month])
);

/**
 * Calculate month number and day within month from day of year
 */
export const calculateMonthAndDay = (dayOfYear: number): { monthNumber: number; dayInMonth: number } => {
  const monthNumber = Math.floor((dayOfYear - 1) / DAYS_PER_MONTH) + 1;
  const dayInMonth = ((dayOfYear - 1) % DAYS_PER_MONTH) + 1;
  return { monthNumber, dayInMonth };
};

/**
 * Get fallback date format when month lookup fails
 */
const getFallbackDateFormat = (year: number, day: number): string => {
  return `${year}, Day ${day}`;
};

/**
 * Format god information with proper translation
 */
export const formatGodInfo = (
  godName: string,
  godMonthNumber: number,
  season: string,
  t: TranslationKeys
): string => {
  const ordinal = (t.calendar.ordinals as Record<number, string>)[godMonthNumber] || godMonthNumber.toString();
  const translatedSeason = (t.calendar.seasons as Record<string, string>)[season] || season;
  
  // Replace placeholders in date format pattern
  return t.calendar.dateFormat
    .replace('{god}', godName)
    .replace('{ordinal}', ordinal)
    .replace('{season}', translatedSeason);
};

/**
 * Format a Pyarr calendar date with full information
 * @param year - The year
 * @param day - Day of year (1-620)
 * @param godName - God associated with this month (optional)
 * @param godMonthNumber - Which month for that god (1-4) (optional)
 * @param season - Season name (optional)
 * @param t - Translations object
 * @returns Formatted date string
 */
export const formatPyarrDate = (
  year: number | null | undefined,
  day: number | null | undefined,
  godName: string | null | undefined,
  godMonthNumber: number | null | undefined,
  season: string | null | undefined,
  t: TranslationKeys
): string => {
  // Check for null/undefined
  if (year == null || day == null) {
    return '';
  }
  
  // Validate day is within valid range (1-620)
  if (day < 1 || day > DAYS_PER_YEAR) {
    return getFallbackDateFormat(year, day);
  }
  
  // Calculate month and day
  const { monthNumber, dayInMonth } = calculateMonthAndDay(day);
  const month = MONTHS_MAP.get(monthNumber);
  
  // If month lookup fails, return fallback format
  if (!month) {
    return getFallbackDateFormat(year, day);
  }
  
  // Base format: "3692, Szándék 1"
  let formattedDate = `${year}, ${month.name} ${dayInMonth}`;
  
  // Add god info if available from backend
  if (godName && godMonthNumber != null && season) {
    const godInfo = formatGodInfo(godName, godMonthNumber, season, t);
    formattedDate += ` (${godInfo})`;
  }
  
  return formattedDate;
};

/**
 * Format inventory date - same as formatPyarrDate but returns '-' for invalid dates
 */
export const formatInventoryDate = (
  year: number | null | undefined,
  day: number | null | undefined,
  godName: string | null | undefined,
  godMonthNumber: number | null | undefined,
  season: string | null | undefined,
  t: TranslationKeys
): string => {
  // Check for null/undefined
  if (year == null || day == null) {
    return '-';
  }
  
  // Validate day is within valid range (1-620)
  if (day < 1 || day > DAYS_PER_YEAR) {
    return '-';
  }
  
  // Calculate month and day
  const { monthNumber, dayInMonth } = calculateMonthAndDay(day);
  const month = MONTHS_MAP.get(monthNumber);
  
  // If month lookup fails, return dash
  if (!month) {
    return '-';
  }
  
  // Base format: "3692, Szándék 1"
  let formattedDate = `${year}, ${month.name} ${dayInMonth}`;
  
  // Add god info if available from backend
  if (godName && godMonthNumber != null && season) {
    const godInfo = formatGodInfo(godName, godMonthNumber, season, t);
    formattedDate += ` (${godInfo})`;
  }
  
  return formattedDate;
};
