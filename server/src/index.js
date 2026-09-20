require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('./app');
const { seed } = require('./seed');
const sim = require('./simulator');
const { getSecret, ensureAdmin } = require('./auth');
require('./realtime');

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_waste';

async function main() {
  getSecret(); // stops the server early in production when JWT_SECRET is missing
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await seed({ force: false }); // fills an empty database with sample data
  await ensureAdmin();
  await sim.start();

  const server = createApp().listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    sim.stop();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Could not start the server:', err.message);
  process.exit(1);
});
