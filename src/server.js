'use strict';

// Express habit tracker — server-rendered EJS views, SQLite storage.
//
// The app is served behind an ingress at `/e2e-lane-enterprise/*` which strips
// the prefix before proxying to this pod. So backend routes are root-relative
// (`/habits`) while every rendered link/form/asset is prefixed via the `url()`
// helper (BASE_PATH). Set BASE_PATH="" for local development at the root.

const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const BASE = process.env.BASE_PATH !== undefined
  ? process.env.BASE_PATH
  : '/e2e-lane-enterprise';
const PORT = process.env.PORT || 8080;

// View engine.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Body parsing for form posts.
app.use(express.urlencoded({ extended: false }));

// Prefix helper available to every view for links/forms/assets.
app.use((req, res, next) => {
  res.locals.url = (p) => BASE + p;
  next();
});

// Static assets: browser requests `${BASE}/static/...`; ingress strips BASE so
// the app receives `/static/...`.
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// Health endpoints (public — used by pipeline smoke tests).
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health/deep', (req, res) => {
  try {
    const ok = db.ping();
    if (ok) return res.status(200).json({ status: 'ok', db: 'ok' });
    return res.status(503).json({ status: 'error', db: 'error' });
  } catch (err) {
    return res.status(503).json({ status: 'error', db: 'error' });
  }
});

// Routes.
app.get('/', (req, res) => {
  res.redirect(res.locals.url('/habits'));
});

app.get('/habits', (req, res) => {
  res.render('habits', { title: 'My Habits', habits: db.listHabits() });
});

app.get('/habits/new', (req, res) => {
  res.render('new', { title: 'Add Habit', error: null });
});

app.post('/habits', (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res
      .status(400)
      .render('new', { title: 'Add Habit', error: 'Please enter a habit name.' });
  }
  db.addHabit(name);
  res.redirect(res.locals.url('/habits'));
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Habit Tracker' });
});

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Habit tracker listening on 0.0.0.0:${PORT} (base "${BASE}")`);
});

module.exports = app;
