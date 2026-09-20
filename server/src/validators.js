const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Returns an error message, or null when the input is fine.
function validateRegistration({ name, email, password }) {
  const n = String(name || '').trim();
  const e = normalizeEmail(email);
  if (n.length < 2 || n.length > 60) return 'Enter your name (2 to 60 characters).';
  if (e.length > 254 || !EMAIL.test(e)) return 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 72) return 'Password can be at most 72 characters.';
  return null;
}

module.exports = { normalizeEmail, validateRegistration };
