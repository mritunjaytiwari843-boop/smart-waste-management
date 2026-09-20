const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render and similar hosts sit behind a proxy
  // Login uses cookies, so cross-origin access is only allowed for origins you list.
  // With the Vite proxy or the built site served by Express, everything is same-origin.
  const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origins.length) app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api', require('./routes/live'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production, serve the built React app from the same server.
  const dist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    if (err.code === 11000) return res.status(409).json({ error: 'That value is already in use.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}

module.exports = createApp;
