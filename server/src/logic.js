const { STATUS } = require('./constants');

// True when the truck moved from `prev` to `cur` (both 0..1, looping) and passed `at`.
function crossed(prev, cur, at) {
  return cur >= prev ? prev < at && at <= cur : at > prev || at <= cur;
}

// The bin the truck will reach next.
function nextBin(bins, progress) {
  let best = null;
  let gap = Infinity;
  for (const b of bins) {
    const g = (b.at - progress + 1) % 1;
    if (g < gap) {
      gap = g;
      best = b;
    }
  }
  return best;
}

function nextStatus(status) {
  const i = STATUS.indexOf(status);
  return i >= 0 && i < STATUS.length - 1 ? STATUS[i + 1] : null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Admins see every report; everyone else only sees the reports they filed.
function canView(report, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Boolean(report.user) && String(report.user) === String(user.id);
}

function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i < 1) return;
      const key = part.slice(0, i).trim();
      try {
        out[key] = decodeURIComponent(part.slice(i + 1).trim());
      } catch (_e) {
        /* ignore malformed cookie */
      }
    });
  return out;
}

module.exports = { crossed, nextBin, nextStatus, escapeRegex, canView, parseCookies };
