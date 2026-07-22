/**
 * Formats a decimal hours value (e.g. 4.5 or 0.25 or 4.0) into a clean "Xh Ym" string (e.g. "4h 30m" or "15m").
 * Handles string numbers, null, undefined, and zero values cleanly.
 */
export function formatHoursToHHMM(hoursVal: number | string | null | undefined): string {
  if (hoursVal == null || hoursVal === '') return '—';
  const numHours = typeof hoursVal === 'string' ? parseFloat(hoursVal) : hoursVal;
  if (isNaN(numHours) || numHours <= 0) return '0m';

  const totalMinutes = Math.round(numHours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  } else if (hrs > 0) {
    return `${hrs}h 0m`;
  } else {
    return `${mins}m`;
  }
}
