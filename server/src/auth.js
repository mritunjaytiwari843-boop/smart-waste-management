const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { parseCookies } = require('./logic');

const COOKIE = 'wms_token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const isProd = () => process.env.NODE_ENV === 'production';

let secret = process.env.JWT_SECRET;
function getSecret() {
  if (secret) return secret;
  if (isProd()) throw new Error('JWT_SECRET is not set. Add it to your environment variables.');
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is not set. Using a temporary secret, so logins reset when the server restarts.');
  return secret;
}

function cookieOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: isProd(), path: '/' };
}

// Login lives in an httpOnly cookie, so page scripts can never read the token.
function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, getSecret(), { expiresIn: '7d' });
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE });
}

function clearSession(res) {
  res.clearCookie(COOKIE, cookieOptions());
}

function publicUser(user) {
  return { id: String(user._id || user.id), name: user.name, email: user.email, role: user.role };
}

// Returns the signed-in user, or null. The role is read from the database on every request.
async function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).lean();
    return user ? publicUser(user) : null;
  } catch (_err) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  try {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    res.status(403).json({ error: 'Only admins can do this.' });
  };
}

// Creates the admin account from ADMIN_EMAIL and ADMIN_PASSWORD when it does not exist yet.
async function ensureAdmin() {
  const bcrypt = require('bcryptjs');
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('No ADMIN_EMAIL and ADMIN_PASSWORD set, so no admin account was created.');
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return;
  }
  await User.create({ name: 'Admin', email, passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
  console.log(`Admin account created for ${email}`);
}

module.exports = {
  getSecret,
  setSession,
  clearSession,
  publicUser,
  userFromRequest,
  requireAuth,
  requireRole,
  ensureAdmin
};
