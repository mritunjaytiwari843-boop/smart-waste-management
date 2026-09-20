const bus = require('./bus');
const sim = require('./simulator');
const { getStats } = require('./services/stats');

// Recalculates dashboard numbers shortly after anything that changes them,
// then pushes them to every connected browser.
let timer = null;
bus.on('stats-dirty', () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      bus.emit('stats', await getStats(sim.bins));
    } catch (err) {
      console.error('Stats update failed:', err.message);
    }
  }, 250);
});
