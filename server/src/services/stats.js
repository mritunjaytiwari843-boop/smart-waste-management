const Report = require('../models/Report');
const Pickup = require('../models/Pickup');
const { TYPES } = require('../constants');

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function getStats(bins) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekStart = new Date(startOfToday);
  weekStart.setDate(weekStart.getDate() - 6);

  const [openReports, pickups, typeRows, collected] = await Promise.all([
    Report.countDocuments({ status: { $ne: 'collected' } }),
    Pickup.find({ at: { $gte: weekStart } }, { at: 1 }).lean(),
    Report.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]),
    Report.find({ status: 'collected' }, { events: 1 }).sort({ updatedAt: -1 }).limit(200).lean()
  ]);

  // Collections for each of the last 7 days (oldest first, today last).
  const perDay = new Map();
  pickups.forEach((p) => {
    const k = dayKey(new Date(p.at));
    perDay.set(k, (perDay.get(k) || 0) + 1);
  });
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    week.push({ date: d.toISOString(), count: perDay.get(dayKey(d)) || 0 });
  }

  const types = {};
  TYPES.forEach((t) => {
    types[t] = 0;
  });
  typeRows.forEach((r) => {
    if (types[r._id] !== undefined) types[r._id] = r.n;
  });

  const minutes = [];
  collected.forEach((r) => {
    const a = r.events.find((e) => e.status === 'reported');
    const c = r.events.find((e) => e.status === 'collected');
    if (a && c) minutes.push((new Date(c.at) - new Date(a.at)) / 60000);
  });
  const avgPickupMinutes = minutes.length ? minutes.reduce((x, y) => x + y, 0) / minutes.length : null;

  return {
    openReports,
    binsFull: bins.filter((b) => b.fill >= 80).length,
    collectedToday: week[6].count,
    avgPickupMinutes,
    week,
    types
  };
}

module.exports = { getStats };
