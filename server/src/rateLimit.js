// Small in-memory limiter: at most `max` requests per `windowMs` for each IP address.
// Good enough for one server; use a shared store (for example Redis) if you run several.
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => {
      if (v.reset < now) hits.delete(k);
    });
  }, windowMs);
  if (sweep.unref) sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.reset < now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
    }
    next();
  };
}

module.exports = { rateLimit };
