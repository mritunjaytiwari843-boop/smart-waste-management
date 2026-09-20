const express = require('express');
const bus = require('../bus');
const sim = require('../simulator');
const { getFeed } = require('../activity');
const { getStats } = require('../services/stats');
const { userFromRequest } = require('../auth');
const { canView } = require('../logic');

const router = express.Router();

// Everything the dashboard needs for its first paint.
router.get('/state', async (_req, res, next) => {
  try {
    res.json({ ...sim.snapshot(), feed: getFeed(), stats: await getStats(sim.bins) });
  } catch (err) {
    next(err);
  }
});

router.get('/bins', (_req, res) => {
  res.json(sim.snapshot().bins);
});

router.get('/stats', async (_req, res, next) => {
  try {
    res.json(await getStats(sim.bins));
  } catch (err) {
    next(err);
  }
});

// Server-Sent Events: tick (truck + bin levels), activity, stats for everyone;
// report updates only for the report's owner and for admins.
router.get('/stream', async (req, res) => {
  const user = await userFromRequest(req); // null for visitors who are not signed in
  if (req.destroyed) return; // the browser left while we were checking the login
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();

  const events = ['tick', 'activity', 'report', 'stats'];
  const handlers = {};
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  events.forEach((name) => {
    handlers[name] =
      name === 'report'
        ? (data) => canView(data, user) && send(name, data) // people only receive their own reports
        : (data) => send(name, data);
    bus.on(name, handlers[name]);
  });
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(ping);
    events.forEach((name) => bus.off(name, handlers[name]));
  });
  res.write('retry: 3000\n\n');
});

module.exports = router;
