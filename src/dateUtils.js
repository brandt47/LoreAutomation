/**
 * Date utilities for computing preorder dates.
 *
 * Timeline each week:
 *   cutoff  = next Saturday  (last day customers can place a preorder)
 *   pickup  = Wed → Sat of the week after the cutoff
 */

function nextSaturday() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun … 6 = Sat
  const daysUntil = ((6 - day) + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntil);
  sat.setHours(0, 0, 0, 0);
  return sat;
}

function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextWeekRange() {
  const cutoff = nextSaturday();

  const pickupStart = new Date(cutoff);
  pickupStart.setDate(cutoff.getDate() + 4); // Wednesday after cutoff

  const pickupEnd = new Date(pickupStart);
  pickupEnd.setDate(pickupStart.getDate() + 3); // Saturday

  return { cutoff, start: pickupStart, end: pickupEnd };
}

module.exports = { nextSaturday, formatYYYYMMDD, getNextWeekRange };
