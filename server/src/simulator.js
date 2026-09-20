const Bin = require('./models/Bin');
const Report = require('./models/Report');
const Pickup = require('./models/Pickup');
const bus = require('./bus');
const { say } = require('./activity');
const { setStatus } = require('./services/reports');
const { crossed, nextBin } = require('./logic');
const { LOOP_SECONDS, SKIP_BELOW } = require('./constants');

// Stands in for the sensors and the dispatcher: bins fill up, Truck 12 drives
// its loop, and reports move along as the truck reaches their area.
class Simulator {
  constructor() {
    this.progress = 0.68; // 0..1 position on the route
    this.bins = [];
    this.ticks = 0;
    this.busy = false;
    this.timer = null;
  }

  async start() {
    this.bins = await Bin.find().sort({ at: 1 }).lean();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  stop() {
    clearInterval(this.timer);
  }

  snapshot() {
    return {
      progress: this.progress,
      loopSeconds: LOOP_SECONDS,
      bins: this.bins.map((b) => ({
        code: b.code,
        area: b.area,
        type: b.type,
        fill: b.fill,
        at: b.at,
        label: b.label
      }))
    };
  }

  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      const prev = this.progress;
      this.progress = (this.progress + 1 / LOOP_SECONDS) % 1;
      this.ticks++;
      const everyOther = this.ticks % 2 === 0;

      if (everyOther) {
        this.bins.forEach((b) => {
          if (Math.random() < 0.7) b.fill = Math.min(100, b.fill + Math.round(Math.random() * 2));
        });
      }
      for (const b of this.bins) {
        if (crossed(prev, this.progress, b.at)) await this.pass(b);
      }
      if (everyOther) await this.moveReports();
      if (this.ticks % 10 === 0) await this.persistFills();

      bus.emit('tick', {
        progress: this.progress,
        bins: this.bins.map((b) => ({ code: b.code, fill: b.fill }))
      });
    } catch (err) {
      console.error('Simulator tick failed:', err.message);
    } finally {
      this.busy = false;
    }
  }

  async pass(bin) {
    const pending = await Report.find({ area: bin.area, status: { $in: ['assigned', 'onway'] } });
    if (bin.fill >= SKIP_BELOW || pending.length) {
      const was = bin.fill;
      bin.fill = 3 + Math.floor(Math.random() * 6);
      await Pickup.create({ binCode: bin.code, area: bin.area, fillAtPickup: was });
      await Bin.updateOne({ code: bin.code }, { $set: { fill: bin.fill } });
      say(`Truck 12 collected ${bin.code} at ${bin.area} (${was}% full)`);
      for (const r of pending) await setStatus(r, 'collected');
      bus.emit('stats-dirty');
    } else {
      say(`Truck 12 skipped ${bin.code} at ${bin.area} (${bin.fill}% full)`);
    }
  }

  async moveReports() {
    // Reports waiting for a truck get assigned after a few seconds.
    const cutoff = new Date(Date.now() - 6000);
    const waiting = await Report.find({ status: 'reported' });
    for (const r of waiting) {
      const last = r.events[r.events.length - 1];
      if (!last || new Date(last.at) < cutoff) await setStatus(r, 'assigned');
    }
    // Assigned reports in the truck's next area are now "on the way".
    const next = nextBin(this.bins, this.progress);
    if (next) {
      const list = await Report.find({ area: next.area, status: 'assigned' });
      for (const r of list) await setStatus(r, 'onway');
    }
  }

  async persistFills() {
    if (!this.bins.length) return;
    await Bin.bulkWrite(
      this.bins.map((b) => ({ updateOne: { filter: { code: b.code }, update: { $set: { fill: b.fill } } } }))
    );
  }
}

module.exports = new Simulator();
