// Pure date-window helpers for automatic optimization. No external dependencies
// so they can be unit tested in isolation.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Merge a new [start, end] window into an existing one, returning the union.
 * @param {{start: Date, end: Date}|null} current
 * @param {Date|string|number} start
 * @param {Date|string|number} end
 * @returns {{start: Date, end: Date}}
 */
function mergeRange(current, start, end) {
  const s = new Date(start);
  const e = new Date(end);
  if (!current) return { start: s, end: e };
  return {
    start: current.start < s ? current.start : s,
    end: current.end > e ? current.end : e
  };
}

/**
 * Build a "now .. now + `days`" window.
 * @param {number} [days=7]
 * @param {Date} [from=new Date()]
 * @returns {{start: Date, end: Date}}
 */
function nextDaysRange(days = 7, from = new Date()) {
  const start = new Date(from);
  const end = new Date(start.getTime() + days * DAY_MS);
  return { start, end };
}

module.exports = { DAY_MS, mergeRange, nextDaysRange };
