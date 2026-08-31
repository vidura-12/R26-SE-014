const { runOptimization } = require('./optimizer.service');
const { notifyOptimizationComplete } = require('./notification.service');
const { mergeRange, nextDaysRange } = require('../utils/optimizeWindow');

/**
 * Fire-and-forget automatic optimization.
 *
 * Domain events (a harvest request being created/updated, a peeler group changing
 * its availability, capacity, location or size) call `triggerAutoOptimize`. Runs are
 * debounced and coalesced so a burst of edits produces a single optimization pass
 * over the widest requested date range, and only one pass runs at a time.
 *
 * The manual optimizer endpoint stays available as a fallback; failures here are
 * expected whenever there aren't yet enough pending requests / active peelers, so
 * they are logged and swallowed rather than surfaced to the triggering request.
 */

const DEBOUNCE_MS = Number(process.env.AUTO_OPTIMIZE_DEBOUNCE_MS || 8000);
const ENABLED = process.env.AUTO_OPTIMIZE_ENABLED !== 'false';

let timer = null;
let running = false;
let pending = null; // { start: Date, end: Date, reasons: Set<string>, createdBy?: ObjectId }

const scheduleRun = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    execute().catch((err) => console.warn('[auto-optimize] run error:', err.message));
  }, DEBOUNCE_MS);
};

async function execute() {
  timer = null;
  if (running) {
    scheduleRun();
    return;
  }
  const job = pending;
  pending = null;
  if (!job) return;

  running = true;
  try {
    const schedule = await runOptimization({
      weekStartDate: job.start,
      weekEndDate: job.end,
      createdBy: job.createdBy
    });
    try {
      await notifyOptimizationComplete({ schedule });
    } catch (_) {}
    console.log(
      `[auto-optimize] schedule ${schedule._id} generated for ` +
        `${job.start.toISOString().slice(0, 10)}..${job.end.toISOString().slice(0, 10)} ` +
        `(${[...job.reasons].join(', ')})`
    );
  } catch (err) {
    console.warn(`[auto-optimize] skipped: ${err.message}`);
  } finally {
    running = false;
    if (pending) scheduleRun();
  }
}

/**
 * Queue an automatic optimization for the given date range.
 * @param {Object} opts
 * @param {Date|string|number} opts.weekStartDate
 * @param {Date|string|number} opts.weekEndDate
 * @param {string} [opts.reason]  short label for logs
 * @param {*} [opts.createdBy]    user id to attribute the generated schedule to
 */
function triggerAutoOptimize({ weekStartDate, weekEndDate, reason, createdBy } = {}) {
  if (!ENABLED) return;

  const start = new Date(weekStartDate);
  const end = new Date(weekEndDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return;

  const merged = mergeRange(pending, start, end);
  pending = {
    start: merged.start,
    end: merged.end,
    reasons: new Set([...(pending ? pending.reasons : []), reason].filter(Boolean)),
    createdBy: createdBy || (pending ? pending.createdBy : undefined)
  };

  if (!running) scheduleRun();
}

/**
 * Convenience wrapper: optimize over "now .. now + `days`" (default 7).
 */
function triggerAutoOptimizeForNextDays({ days = 7, reason, createdBy } = {}) {
  const { start, end } = nextDaysRange(days);
  triggerAutoOptimize({ weekStartDate: start, weekEndDate: end, reason, createdBy });
}

module.exports = { triggerAutoOptimize, triggerAutoOptimizeForNextDays, mergeRange, nextDaysRange };
