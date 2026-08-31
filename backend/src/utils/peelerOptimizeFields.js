// Peeler-group fields whose change should trigger a re-optimization.
// Kept dependency-free so it can be unit tested in isolation.

const OPTIMIZATION_FIELDS = ['availability', 'peelingCapacityTreesPerHour', 'currentLocation', 'groupSize'];

/**
 * True if `body` contains at least one field the optimizer cares about.
 * A field counts as "present" whenever its key is set, even to a falsy value
 * (e.g. `groupSize: 0`).
 */
const touchesOptimization = (body) =>
  !!body && OPTIMIZATION_FIELDS.some((f) => body[f] !== undefined);

module.exports = { OPTIMIZATION_FIELDS, touchesOptimization };
