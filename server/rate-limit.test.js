import test from 'node:test';
import assert from 'node:assert/strict';
import { attendeeRateLimitKey, rateLimit } from './rate-limit.js';

const attendeeA = '11111111-1111-4111-8111-111111111111';
const attendeeB = '22222222-2222-4222-8222-222222222222';

function run(middleware, req) {
  let result;
  middleware(req, {}, error => { result = error || null; });
  return result;
}

test('attendee rate limits do not group different attendees on the same IP', () => {
  const middleware = rateLimit(1, 60000, attendeeRateLimitKey);
  const request = attendeeId => ({ body: { attendeeId }, ip: '203.0.113.10', path: `/api/test/${Date.now()}` });
  const first = request(attendeeA);
  assert.equal(run(middleware, first), null);
  assert.equal(run(middleware, { ...first, body: { attendeeId: attendeeB } }), null);
  assert.equal(run(middleware, first)?.status, 429);
});

test('invalid attendee IDs fall back to the request IP', () => {
  const middleware = rateLimit(1, 60000, attendeeRateLimitKey);
  const path = `/api/invalid-test/${Date.now()}`;
  assert.equal(run(middleware, { body: {}, ip: '203.0.113.20', path }), null);
  assert.equal(run(middleware, { body: { attendeeId: 'invalid' }, ip: '203.0.113.20', path })?.status, 429);
});
