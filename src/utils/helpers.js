/**
 * Formats a Date object into a string representation "YYYY.MM.DD".
 * Includes error handling for invalid input and formatting errors.
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string (e.g., "2023.01.15"), or an empty string if the input is invalid or an error occurs.
 * @example
 * const myDate = new Date(2024, 0, 5); // January 5, 2024
 * formatDate(myDate); // returns "2024.01.05"
 * formatDate(null); // returns ""
 */
export const formatDate = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("formatDate received invalid input:", date);
    return "";
  }
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  } catch (e) {
    console.error("Error formatting date:", date, e);
    return "";
  }
};

/**
 * Retrieves the Hungarian name for the day of the week from a Date object.
 * Includes error handling for invalid input.
 *
 * @param {Date} date - The Date object.
 * @returns {string} The Hungarian name of the day (e.g., "Hétfő"), or an empty string if the input is invalid or an error occurs.
 * @example
 * const myDate = new Date(2024, 0, 8); // Monday, January 8, 2024
 * getDayName(myDate); // returns "Hétfő"
 * getDayName('not a date'); // returns ""
 */
export const getDayName = (date) => {
  if (!(date instanceof Date)) {
    console.warn("getDayName received invalid input:", date);
    return "";
  }
  const days = [
    "Vasárnap",
    "Hétfő",
    "Kedd",
    "Szerda",
    "Csütörtök",
    "Péntek",
    "Szombat",
  ];
  try {
    return days[date.getDay()];
  } catch (e) {
    console.error("Error getting day name:", date, e);
    return "";
  }
};

/**
 * Generates a string representing the date range of a given week.
 * Uses the `formatDate` function for consistent formatting.
 * Assumes the input array contains at least one Date object.
 *
 * @param {Date[]} weekDates - An array of Date objects representing the days of the week, typically starting with Monday.
 * @returns {string} A formatted string representing the week range (e.g., "2023.01.02 - 2023.01.07"), or an empty string if the input is invalid or empty.
 * @example
 * const dates = [new Date(2024, 0, 8), new Date(2024, 0, 13)]; // Mon, Sat
 * getWeekRangeString(dates); // returns "2024.01.08 - 2024.01.13"
 * getWeekRangeString([]); // returns ""
 */
export const getWeekRangeString = (weekDates) => {
  if (!Array.isArray(weekDates) || weekDates.length === 0) {
    console.warn(
      "getWeekRangeString received invalid or empty input:",
      weekDates,
    );
    return "";
  }
  try {
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[weekDates.length - 1]);
    if (!startDate || !endDate) {
      // Handle potential errors from formatDate within the range
      return "";
    }
    return `${startDate} - ${endDate}`;
  } catch (e) {
    console.error("Error creating week range string:", weekDates, e);
    return "";
  }
};

/**
 * Calculates the Date object representing the Monday of the week containing the provided date.
 * If no date is provided, it defaults to the current week.
 * Includes error handling and fallbacks.
 *
 * @param {Date} [dateInput=new Date()] - The date for which to find the corresponding Monday. Defaults to the current date.
 * @returns {Date} A Date object set to the Monday of the specified or current week. Returns the calculated Monday of the current week as a fallback on error.
 * @example
 * const someDate = new Date(2024, 0, 10); // Wednesday, January 10, 2024
 * getCurrentMonday(someDate); // returns Date object for Monday, January 8, 2024
 * getCurrentMonday(); // returns Date object for the Monday of the current week
 */
export const getCurrentMonday = (dateInput = new Date()) => {
  let now;
  // Validate input and create a safe copy or default
  if (dateInput instanceof Date && !isNaN(dateInput)) {
    now = new Date(dateInput); // Clone the valid date
  } else {
    if (!(dateInput instanceof Date)) {
      console.warn(
        "getCurrentMonday received non-Date input, using current date instead:",
        dateInput,
      );
    } else if (isNaN(dateInput)) {
      console.warn(
        "getCurrentMonday received invalid Date object, using current date instead:",
        dateInput,
      );
    }
    now = new Date(); // Default to today if input is not a valid Date
  }

  try {
    const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // Calculate the difference in days to get to the previous Monday.
    // If today is Sunday (0), we need to go back 6 days.
    // Otherwise, go back (currentDay - 1) days.
    const diffToMonday =
      now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    // Create a new Date object for the Monday to avoid modifying 'now'
    const monday = new Date(now.setDate(diffToMonday));
    return monday;
  } catch (e) {
    console.error("Error calculating current Monday for date:", dateInput, e);
    // Fallback: Calculate Monday based on a fresh 'today' Date object if error occurred
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }
};

/**
 * Generates an array of six Date objects representing Monday to Saturday,
 * starting from the provided start date (assumed to be a Monday).
 * Includes error handling for invalid input.
 *
 * @param {Date} startDate - The Date object representing the Monday of the desired week.
 * @returns {Date[]} An array containing six Date objects (Monday to Saturday), or an empty array if the input is invalid or an error occurs.
 * @example
 * const monday = new Date(2024, 0, 8);
 * getWeekDates(monday); // returns array of Date objects for Jan 8, 9, 10, 11, 12, 13
 * getWeekDates(new Date('invalid date')); // returns []
 */
export const getWeekDates = (startDate) => {
  if (!(startDate instanceof Date)) {
    console.warn("getWeekDates received invalid input:", startDate);
    return [];
  }
  try {
    // Create an array of 6 elements
    return Array(6)
      .fill(null) // Use null or any placeholder
      .map((_, index) => {
        // For each element, calculate the date
        const date = new Date(startDate); // Start with a copy of the Monday
        date.setDate(date.getDate() + index); // Add the index (0 to 5) to get Mon, Tue, ..., Sat
        return date;
      });
  } catch (e) {
    console.error("Error getting week dates:", startDate, e);
    return [];
  }
};

/**
 * Calculates the ISO 8601 week number for a given date.
 * In ISO 8601, weeks start on Monday, and week 1 is the first week with a Thursday.
 * Includes error handling for invalid input.
 *
 * @param {Date} date - The Date object for which to determine the ISO week number.
 * @returns {number} The ISO 8601 week number (1-53), or 0 if the input is invalid or an error occurs.
 * @example
 * const date = new Date(2024, 0, 8); // Monday, Jan 8, 2024
 * getWeekNumber(date); // returns 2
 * getWeekNumber(new Date(2026, 0, 1)); // Thursday, Jan 1, 2026
 * getWeekNumber(new Date(2026, 0, 1)); // returns 1
 */
export const getWeekNumber = (date) => {
  if (!(date instanceof Date)) {
    console.warn("getWeekNumber received invalid input:", date);
    return 0;
  }
  try {
    // Create a copy to avoid modifying the original date
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    // Set to Thursday of the week. getUTCDay() is 0 for Sunday. Make Sunday 7.
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    // Get first day of the year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  } catch (e) {
    console.error("Error getting week number:", date, e);
    return 0;
  }
};

/**
 * Determines if the week containing the given date is an even-numbered week according to ISO 8601 standard.
 * Uses `getWeekNumber` for the calculation.
 *
 * @param {Date} date - The Date object to check.
 * @returns {boolean} True if the ISO week number is even, false otherwise or if the input is invalid.
 * @example
 * const dateInWeek2 = new Date(2024, 0, 8); // Jan 8, 2024 is in week 2
 * isEvenWeek(dateInWeek2); // returns true
 * const dateInWeek1 = new Date(2024, 0, 1); // Jan 1, 2024 is in week 1
 * isEvenWeek(dateInWeek1); // returns false
 */
export const isEvenWeek = (date) => {
  if (!(date instanceof Date)) {
    console.warn("isEvenWeek received invalid input:", date);
    return false; // Consider invalid date as not being in an even week
  }
  const weekNumber = getWeekNumber(date);
  // Ensure weekNumber is valid (non-zero) before checking parity
  return weekNumber > 0 && weekNumber % 2 === 0;
};

/**
 * @function getContrastingTextColor
 * Calculates a contrasting text color (black or white) for a given background hex color.
 * Uses WCAG luma formula for basic accessibility.
 * @param {string} bgColor - The background color in hex format (e.g., "#aabbcc").
 * @returns {string} '#ffffff' (white) or '#000000' (black).
 */
export const getContrastingTextColor = (bgColor) => {
  if (!bgColor || typeof bgColor !== "string" || bgColor.length < 4)
    return "#000000"; // Default to black for invalid/missing colors

  // Handle short hex codes (#fff) -> #ffffff
  let normalizedColor = bgColor;
  if (bgColor.length === 4) {
    normalizedColor = `#${bgColor[1]}${bgColor[1]}${bgColor[2]}${bgColor[2]}${bgColor[3]}${bgColor[3]}`;
  }

  try {
    const color = normalizedColor.substring(1); // Remove #
    const rgb = parseInt(color, 16); // Convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff; // Extract red
    const g = (rgb >> 8) & 0xff; // Extract green
    const b = (rgb >> 0) & 0xff; // Extract blue
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // Calculate luminance (per WCAG)
    return luma < 128 ? "#ffffff" : "#000000"; // Return white for dark backgrounds, black for light
  } catch (e) {
    console.error("Error calculating text color for", bgColor, e);
    return "#000000"; // Default to black on error
  }
};
