const TYPES = ['Wet', 'Dry', 'Mixed', 'Hazardous', 'E-waste'];
const STATUS = ['reported', 'assigned', 'onway', 'collected'];
const STATUS_LABEL = {
  reported: 'reported',
  assigned: 'assigned',
  onway: 'on the way',
  collected: 'collected'
};

// Bins under this fill level are skipped by the truck to save trips.
const SKIP_BELOW = 40;
const LOOP_SECONDS = Number(process.env.LOOP_SECONDS) || 34;

// "at" is the bin's position along the truck route, from 0 to 1.
const ROUTE_LENGTH = 1897;
const BINS = [
  { code: 'B-01', area: 'Market Road',     type: 'Mixed', fill: 72, at: 140 / ROUTE_LENGTH,  label: 'up' },
  { code: 'B-02', area: 'Bus Stand',       type: 'Dry',   fill: 35, at: 470 / ROUTE_LENGTH,  label: 'up' },
  { code: 'B-03', area: 'Civil Lines',     type: 'Mixed', fill: 88, at: 700 / ROUTE_LENGTH,  label: 'left' },
  { code: 'B-04', area: 'Park Colony',     type: 'Wet',   fill: 54, at: 880 / ROUTE_LENGTH,  label: 'down' },
  { code: 'B-05', area: 'Industrial Area', type: 'Mixed', fill: 91, at: 1070 / ROUTE_LENGTH, label: 'right' },
  { code: 'B-06', area: 'Hospital Road',   type: 'Mixed', fill: 29, at: 1290 / ROUTE_LENGTH, label: 'down' },
  { code: 'B-07', area: 'College Gate',    type: 'Dry',   fill: 63, at: 1470 / ROUTE_LENGTH, label: 'left' },
  { code: 'B-08', area: 'Sabzi Mandi',     type: 'Wet',   fill: 47, at: 1780 / ROUTE_LENGTH, label: 'right' }
];
const AREAS = BINS.map((b) => b.area);

module.exports = { TYPES, STATUS, STATUS_LABEL, SKIP_BELOW, LOOP_SECONDS, BINS, AREAS };
