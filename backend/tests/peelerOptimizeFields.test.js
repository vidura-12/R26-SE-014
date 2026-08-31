const test = require('node:test');
const assert = require('node:assert/strict');

const { OPTIMIZATION_FIELDS, touchesOptimization } = require('../src/utils/peelerOptimizeFields');

test('availability / capacity / location / group size are the watched fields', () => {
  assert.deepEqual(
    [...OPTIMIZATION_FIELDS].sort(),
    ['availability', 'currentLocation', 'groupSize', 'peelingCapacityTreesPerHour'].sort()
  );
});

test('each watched field triggers a re-optimize', () => {
  for (const field of OPTIMIZATION_FIELDS) {
    assert.equal(touchesOptimization({ [field]: 'anything' }), true, `${field} should trigger`);
  }
});

test('unrelated fields do not trigger a re-optimize', () => {
  assert.equal(touchesOptimization({ groupName: 'Kandy Peelers', leaderName: 'A', skillLevel: 5 }), false);
});

test('an empty, missing or null body does not trigger', () => {
  assert.equal(touchesOptimization({}), false);
  assert.equal(touchesOptimization(), false);
  assert.equal(touchesOptimization(null), false);
});

test('a mixed body with one watched field still triggers', () => {
  assert.equal(touchesOptimization({ groupName: 'x', groupSize: 12 }), true);
});

test('a falsy-but-present watched value still counts as a change', () => {
  assert.equal(touchesOptimization({ groupSize: 0 }), true);
});
