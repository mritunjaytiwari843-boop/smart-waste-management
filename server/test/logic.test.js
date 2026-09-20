const test = require('node:test');
const assert = require('node:assert');
const { crossed, nextBin, nextStatus, escapeRegex } = require('../src/logic');
const { BINS } = require('../src/constants');

test('crossed detects a bin passed between two positions', () => {
  assert.strictEqual(crossed(0.10, 0.13, 0.12), true);
  assert.strictEqual(crossed(0.10, 0.13, 0.20), false);
  assert.strictEqual(crossed(0.10, 0.13, 0.10), false); // start point is not "passed"
  assert.strictEqual(crossed(0.10, 0.13, 0.13), true); // end point is
});

test('crossed works when the truck wraps around the loop', () => {
  assert.strictEqual(crossed(0.99, 0.01, 0.995), true);
  assert.strictEqual(crossed(0.99, 0.01, 0.005), true);
  assert.strictEqual(crossed(0.99, 0.01, 0.5), false);
});

test('nextBin returns the closest bin ahead of the truck', () => {
  assert.strictEqual(nextBin(BINS, 0.0).code, 'B-01');
  assert.strictEqual(nextBin(BINS, 0.75).code, 'B-07');
  assert.strictEqual(nextBin(BINS, 0.99).code, 'B-01'); // wraps around
});

test('nextStatus follows the four steps and stops at collected', () => {
  assert.strictEqual(nextStatus('reported'), 'assigned');
  assert.strictEqual(nextStatus('assigned'), 'onway');
  assert.strictEqual(nextStatus('onway'), 'collected');
  assert.strictEqual(nextStatus('collected'), null);
  assert.strictEqual(nextStatus('nonsense'), null);
});

test('escapeRegex neutralises special characters in search text', () => {
  const rx = new RegExp(escapeRegex('a.b(c)*'), 'i');
  assert.ok(rx.test('xa.b(c)*y'));
  assert.ok(!rx.test('aXb(c)'));
});

const { canView, parseCookies } = require('../src/logic');
const { validateRegistration, normalizeEmail } = require('../src/validators');
const { rateLimit } = require('../src/rateLimit');

test('canView: admins see all, others only their own reports', () => {
  const report = { user: 'u1' };
  assert.strictEqual(canView(report, { id: 'u1', role: 'citizen' }), true);
  assert.strictEqual(canView(report, { id: 'u2', role: 'citizen' }), false);
  assert.strictEqual(canView(report, { id: 'a1', role: 'admin' }), true);
  assert.strictEqual(canView(report, null), false);
  assert.strictEqual(canView({}, { id: 'u1', role: 'citizen' }), false); // old sample reports have no owner
  assert.strictEqual(canView({ user: { toString: () => 'u1' } }, { id: 'u1', role: 'citizen' }), true); // ObjectId-like
});

test('parseCookies reads values and ignores broken ones', () => {
  assert.deepStrictEqual(parseCookies('a=1; wms_token=abc%20def; b'), { a: '1', wms_token: 'abc def' });
  assert.deepStrictEqual(parseCookies('bad=%E0%A4%A; ok=1'), { ok: '1' });
  assert.deepStrictEqual(parseCookies(undefined), {});
});

test('validateRegistration checks name, email and password', () => {
  const good = { name: 'Asha', email: 'Asha@Example.com', password: 'longenough1' };
  assert.strictEqual(validateRegistration(good), null);
  assert.match(validateRegistration({ ...good, name: 'A' }), /name/i);
  assert.match(validateRegistration({ ...good, email: 'not-an-email' }), /email/i);
  assert.match(validateRegistration({ ...good, password: 'short' }), /8 characters/);
  assert.match(validateRegistration({ ...good, password: 'x'.repeat(73) }), /72/);
  assert.strictEqual(normalizeEmail('  Asha@Example.COM '), 'asha@example.com');
});

test('rateLimit blocks after the limit and sets Retry-After', () => {
  const limit = rateLimit({ windowMs: 60000, max: 2 });
  const res = { headers: {}, code: 200, set(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json() { return this; } };
  let passed = 0;
  const next = () => { passed++; };
  for (let i = 0; i < 3; i++) limit({ ip: '1.2.3.4' }, res, next);
  assert.strictEqual(passed, 2);
  assert.strictEqual(res.code, 429);
  assert.ok(res.headers['Retry-After']);
  limit({ ip: '5.6.7.8' }, res, next); // another IP is unaffected
  assert.strictEqual(passed, 3);
});
