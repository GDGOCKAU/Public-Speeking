import { AppError, uuid } from './services/logic.js';

const limits = new Map();

export function attendeeRateLimitKey(req) {
  const attendeeId = req.body?.attendeeId;
  return uuid(attendeeId) ? `attendee:${attendeeId.toLowerCase()}` : `ip:${req.ip}`;
}

export function rateLimit(max, windowMs, keyFromRequest = req => `ip:${req.ip}`) {
  return (req, _res, next) => {
    const key = `${keyFromRequest(req)}:${req.path}`;
    const now = Date.now();
    let item = limits.get(key);
    if (!item || item.until < now) item = { count: 0, until: now + windowMs };
    item.count++;
    limits.set(key, item);
    if (item.count > max) return next(new AppError(429, 'Too many attempts. Try again shortly.'));
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, item] of limits) if (item.until < now) limits.delete(key);
}, 60000).unref();
