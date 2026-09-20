const Report = require('../models/Report');
const Counter = require('../models/Counter');
const bus = require('../bus');
const { say } = require('../activity');
const { STATUS_LABEL } = require('../constants');
const { nextStatus } = require('../logic');

async function createReport({ type, area, note, user }) {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'report' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const report = await Report.create({
    code: `WM-${counter.seq}`,
    type,
    area,
    note,
    user: user.id,
    reporterName: user.name,
    status: 'reported',
    events: [{ status: 'reported', at: new Date() }]
  });
  bus.emit('report', report.toJSON());
  say(`New report ${report.code} at ${area}`);
  bus.emit('stats-dirty');
  return report;
}

async function setStatus(report, status) {
  report.status = status;
  report.events.push({ status, at: new Date() });
  await report.save();
  bus.emit('report', report.toJSON());
  say(`${report.code} at ${report.area}: ${STATUS_LABEL[status]}`);
  if (status === 'collected') bus.emit('stats-dirty');
  return report;
}

// Moves a report one step forward (used by the "Advance status" action).
async function advance(report) {
  const next = nextStatus(report.status);
  if (!next) return null;
  return setStatus(report, next);
}

module.exports = { createReport, setStatus, advance };
