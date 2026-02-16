const TIMEZONE = "America/Sao_Paulo";
const UPDATE_HOURS = [8, 20]; // 8 AM and 8 PM

/**
 * Returns the current hour and date components in America/Sao_Paulo timezone.
 */
function nowInTimezone(): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Builds a Date (UTC) that corresponds to a specific wall-clock time in the
 * configured timezone. Uses an iterative approach: create a guess in UTC,
 * measure the offset, and correct.
 */
function dateFromTzComponents(year: number, month: number, day: number, hour: number): Date {
  // First guess: pretend it's UTC
  const guess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));

  // Determine the actual wall-clock hour at that UTC instant
  const wallHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(guess)
      .find((p) => p.type === "hour")?.value ?? 0
  );

  // Adjust by the difference
  const diff = hour - (wallHour === 24 ? 0 : wallHour);
  guess.setUTCHours(guess.getUTCHours() + diff);

  return guess;
}

/**
 * Returns the most recent scheduled update time (8 AM or 8 PM BRT) that has
 * already passed.
 */
export function getLastScheduledTime(): Date {
  const { year, month, day, hour } = nowInTimezone();

  if (hour >= UPDATE_HOURS[1]) {
    return dateFromTzComponents(year, month, day, UPDATE_HOURS[1]);
  }

  if (hour >= UPDATE_HOURS[0]) {
    return dateFromTzComponents(year, month, day, UPDATE_HOURS[0]);
  }

  // Before 8 AM today -- last window was 8 PM yesterday
  const yesterday = new Date(Date.UTC(year, month - 1, day - 1));
  return dateFromTzComponents(
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth() + 1,
    yesterday.getUTCDate(),
    UPDATE_HOURS[1]
  );
}

/**
 * Returns the next scheduled update time (8 AM or 8 PM BRT).
 */
export function getNextUpdateTime(): Date {
  const { year, month, day, hour } = nowInTimezone();

  if (hour < UPDATE_HOURS[0]) {
    return dateFromTzComponents(year, month, day, UPDATE_HOURS[0]);
  }

  if (hour < UPDATE_HOURS[1]) {
    return dateFromTzComponents(year, month, day, UPDATE_HOURS[1]);
  }

  // After 8 PM today -- next window is 8 AM tomorrow
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  return dateFromTzComponents(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth() + 1,
    tomorrow.getUTCDate(),
    UPDATE_HOURS[0]
  );
}

/**
 * Returns the number of milliseconds until the next scheduled update.
 * Guaranteed to be at least 1000ms to avoid zero/negative edge cases.
 */
export function getMsUntilNextUpdate(): number {
  const ms = getNextUpdateTime().getTime() - Date.now();
  return Math.max(ms, 1000);
}
