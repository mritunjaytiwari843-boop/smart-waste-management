const express = require('express');
const Report = require('../models/Report');
const { createReport, advance } = require('../services/reports');
const { TYPES, STATUS, AREAS } = require('../constants');
const { escapeRegex, canView } = require('../logic');
const { requireAuth, requireRole } = require('../auth');
const { rateLimit } = require('../rateLimit');

const router = express.Router();
const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// Everything here needs a signed-in user.
router.use(requireAuth);

// GET /api/reports?status=open|collected|reported|assigned|onway&q=text
// Admins get every report; other users get only their own.
router.get('/', async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') filter.user = req.user.id;
    if (status === 'open') filter.status = { $ne: 'collected' };
    else if (STATUS.includes(status)) filter.status = status;

    const text = typeof q === 'string' ? q.trim().slice(0, 50) : '';
    if (text) {
      const rx = new RegExp(escapeRegex(text), 'i');
      filter.$or = [{ code: rx }, { area: rx }];
    }
    res.json(await Report.find(filter).sort({ createdAt: -1 }).limit(200));
  } catch (err) {
    next(err);
  }
});

// POST /api/reports  { type, area, note }
router.post('/', createLimiter, async (req, res, next) => {
  try {
    const { type, area } = req.body || {};
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'Choose a valid waste type.' });
    if (!AREAS.includes(area)) return res.status(400).json({ error: 'Choose an area from the list.' });
    if (note.length < 10 || note.length > 500) {
      return res.status(400).json({ error: 'Describe the waste in 10 to 500 characters.' });
    }
    res.status(201).json(await createReport({ type, area, note, user: req.user }));
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:code
router.get('/:code', async (req, res, next) => {
  try {
    const report = await Report.findOne({ code: req.params.code.toUpperCase() });
    if (!report || !canView(report, req.user)) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:code/status  moves the report one step forward (admins only)
router.patch('/:code/status', requireRole('admin'), async (req, res, next) => {
  try {
    const report = await Report.findOne({ code: req.params.code.toUpperCase() });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    const updated = await advance(report);
    if (!updated) return res.status(400).json({ error: 'This report is already collected.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
