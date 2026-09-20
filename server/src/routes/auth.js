const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { setSession, clearSession, publicUser, requireAuth } = require('../auth');
const { normalizeEmail, validateRegistration } = require('../validators');
const { rateLimit } = require('../rateLimit');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// Compared against when the email is unknown, so both cases take about as long.
let dummyHash = null;
async function getDummyHash() {
  if (!dummyHash) dummyHash = await bcrypt.hash('not-a-real-password', 10);
  return dummyHash;
}

// POST /api/auth/register  { name, email, password }
router.post('/register', limiter, async (req, res, next) => {
  try {
    const body = req.body || {};
    const problem = validateRegistration(body);
    if (problem) return res.status(400).json({ error: problem });

    const email = normalizeEmail(body.email);
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const user = await User.create({
      name: String(body.name).trim(),
      email,
      passwordHash: await bcrypt.hash(body.password, 10)
    });
    setSession(res, user);
    res.status(201).json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const password = req.body && req.body.password;
    const user = typeof password === 'string' && email ? await User.findOne({ email }) : null;
    const ok = await bcrypt.compare(typeof password === 'string' ? password : '', user ? user.passwordHash : await getDummyHash());
    if (!user || !ok) return res.status(401).json({ error: 'Email or password is incorrect.' });
    setSession(res, user);
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
