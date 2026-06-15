import { addDays, subDays } from 'date-fns';

// Returns an ISO timestamp for exactly 24 hours ago (UTC) — used for precise in-memory filtering.
export function getYesterdayISO() {
  return subDays(new Date(), 1).toISOString();
}

// Returns an ISO timestamp for exactly 24 hours from now (UTC) — used for precise in-memory filtering.
export function getTomorrowISO() {
  return addDays(new Date(), 1).toISOString();
}

// Returns a YYYY-MM-DD string for 2 days ago — used to widen the API date range.
export function get2DaysAgoDate() {
  return subDays(new Date(), 2).toISOString().slice(0, 10);
}

// Returns a YYYY-MM-DD string for 2 days from now — used to widen the API date range.
export function get2DaysFromNowDate() {
  return addDays(new Date(), 2).toISOString().slice(0, 10);
}
