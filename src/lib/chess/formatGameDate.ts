const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daySuffix(d: number): string {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * PGN dates allow unknown parts: "1965.??.??", "1972.07.??".
 * Show only what is actually known instead of the question marks.
 */
export function formatGameDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'Unknown' || trimmed === '????.??.??') return '';

  const parts = trimmed.split('.');
  const year = parts[0];
  if (!/^\d{4}$/.test(year)) return trimmed;
  if (parts.length === 1) return year;

  const month = parts[1];
  if (!/^\d{2}$/.test(month)) return year;
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return year;

  const day = parts[2];
  if (!day || !/^\d{2}$/.test(day)) return `${MONTHS[monthIndex]} ${year}`;
  const dayNum = parseInt(day, 10);
  if (dayNum < 1 || dayNum > 31) return `${MONTHS[monthIndex]} ${year}`;

  return `${MONTHS[monthIndex]} ${dayNum}${daySuffix(dayNum)}, ${year}`;
}
