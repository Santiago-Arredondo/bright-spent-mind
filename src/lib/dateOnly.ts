// Format a Date as YYYY-MM-DD using LOCAL time (no timezone shift).
// Avoids the off-by-one-day bug from toISOString() in negative UTC offsets.
export const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Parse a YYYY-MM-DD (or full ISO) string as a LOCAL date — avoids the
// off-by-one-day shift caused by `new Date("2026-05-01")` being parsed as
// UTC midnight, which becomes April 30 in negative UTC offsets.
export const parseLocalDate = (iso: string | Date): Date => {
  if (iso instanceof Date) return iso;
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
