require('dotenv').config();
const mongoose = require('mongoose');
const Bin = require('./models/Bin');
const Report = require('./models/Report');
const Pickup = require('./models/Pickup');
const Counter = require('./models/Counter');
const { BINS, TYPES, AREAS } = require('./constants');

const MIN = 60000;
const NOTES = [
  'Bin is overflowing and waste is spilling onto the road.',
  'Garbage has been piling up behind the shops since yesterday.',
  'Bags of household waste left next to the bin, not inside it.',
  'Construction debris dumped on the roadside near the corner.',
  'Bad smell from the bin, it has not been emptied for days.'
];
const rnd = (n) => Math.floor(Math.random() * n);

function report(code, type, area, note, steps, now) {
  // steps: [[status, minutesAgo], ...] oldest first
  const events = steps.map(([status, mins]) => ({ status, at: new Date(now - mins * MIN) }));
  return {
    code,
    type,
    area,
    note,
    status: steps[steps.length - 1][0],
    events,
    createdAt: events[0].at,
    updatedAt: events[events.length - 1].at
  };
}

async function seed({ force = false } = {}) {
  if (!force && (await Bin.countDocuments()) > 0) return false;

  await Promise.all([Bin.deleteMany({}), Report.deleteMany({}), Pickup.deleteMany({}), Counter.deleteMany({})]);
  await Bin.insertMany(BINS);

  const now = Date.now();
  const docs = [];

  // Older, already collected reports so the charts have some history.
  for (let i = 0; i < 36; i++) {
    const start = 400 + rnd(43000); // minutes ago, up to about 30 days
    const gap1 = 5 + rnd(10);
    const gap2 = gap1 + 30 + rnd(60);
    const gap3 = gap2 + 20 + rnd(80);
    docs.push(
      report(
        `WM-${1001 + i}`,
        TYPES[rnd(TYPES.length)],
        AREAS[rnd(AREAS.length)],
        NOTES[rnd(NOTES.length)],
        [
          ['reported', start],
          ['assigned', start - gap1],
          ['onway', start - gap2],
          ['collected', start - gap3]
        ],
        now
      )
    );
  }

  // A few live reports to show in the tracker.
  docs.push(
    report('WM-1037', 'Wet', 'Park Colony', 'Garden waste piled up near the park gate.',
      [['reported', 300], ['assigned', 285], ['onway', 240], ['collected', 210]], now),
    report('WM-1038', 'Dry', 'Market Road', 'Cardboard boxes stacked outside shop 14 are blocking the footpath.',
      [['reported', 180], ['assigned', 170], ['onway', 140], ['collected', 120]], now),
    report('WM-1039', 'Hazardous', 'College Gate', 'Broken tube lights dumped next to the school wall.',
      [['reported', 50], ['assigned', 42]], now),
    report('WM-1040', 'Wet', 'Sabzi Mandi', 'Vegetable waste has been overflowing from the bin since morning.',
      [['reported', 35], ['assigned', 31]], now),
    report('WM-1041', 'Mixed', 'Bus Stand', 'Bin lid is broken and waste has spread across the road.',
      [['reported', 0.1]], now),
    report('WM-1042', 'E-waste', 'Industrial Area', 'Old monitors and cables left near the factory gate.',
      [['reported', 22], ['assigned', 20]], now)
  );
  // Insert with the native driver so the createdAt/updatedAt values above are kept.
  await Report.collection.insertMany(docs);
  await Counter.create({ _id: 'report', seq: 1042 });

  // Collections for the previous six days (today starts at zero).
  const perDay = [38, 44, 41, 52, 47, 36]; // 6 days ago ... yesterday
  const pickups = [];
  perDay.forEach((count, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    for (let k = 0; k < count; k++) {
      const b = BINS[rnd(BINS.length)];
      pickups.push({
        binCode: b.code,
        area: b.area,
        fillAtPickup: 40 + rnd(60),
        at: new Date(day.getTime() + (6 + Math.random() * 12) * 60 * MIN)
      });
    }
  });
  await Pickup.insertMany(pickups);

  console.log(`Seeded ${BINS.length} bins, ${docs.length} reports and ${pickups.length} pickups.`);
  return true;
}

module.exports = { seed };

if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_waste')
    .then(() => seed({ force: true }))
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
