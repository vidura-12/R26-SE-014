const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeRange, nextDaysRange } = require('../src/utils/optimizeWindow');

test('mergeRange returns the given window when there is nothing pending', () => {
  const r = mergeRange(null, '2026-09-01', '2026-09-10');
  assert.equal(r.start.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(r.end.toISOString().slice(0, 10), '2026-09-10');
});

test('mergeRange widens to the union of both windows', () => {
  const current = { start: new Date('2026-09-05'), end: new Date('2026-09-12') };
  const r = mergeRange(current, '2026-09-01', '2026-09-20');
  assert.equal(r.start.toISOString().slice(0, 10), '2026-09-01'); // earlier start wins
  assert.equal(r.end.toISOString().slice(0, 10), '2026-09-20');   // later end wins
});

test('mergeRange keeps the wider existing bounds when the new window is inside it', () => {
  const current = { start: new Date('2026-09-01'), end: new Date('2026-09-30') };
  const r = mergeRange(current, '2026-09-10', '2026-09-15');
  assert.equal(r.start.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(r.end.toISOString().slice(0, 10), '2026-09-30');
});

test('nextDaysRange spans exactly N days from the given start', () => {
  const from = new Date('2026-08-31T00:00:00.000Z');
  const { start, end } = nextDaysRange(7, from);
  assert.equal(start.toISOString(), '2026-08-31T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-09-07T00:00:00.000Z');
});

test('nextDaysRange defaults to 7 days', () => {
  const from = new Date('2026-01-01T00:00:00.000Z');
  const { end } = nextDaysRange(undefined, from);
  assert.equal(end.toISOString(), '2026-01-08T00:00:00.000Z');
});
