'use strict';

// SQLite data layer for the habit tracker.
// Storage is a single file (path via DB_PATH); the parent dir is created on
// demand. On first init the `habits` table is created and, when empty, seeded
// with 3 example habits so `/habits` is never blank.

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || './data/habits.db';

// Ensure the parent directory exists before opening the database file.
fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed 3 example habits when the table is empty.
const seed = [
  { name: 'Drink water', streak: 5 },
  { name: 'Read 20 minutes', streak: 2 },
  { name: 'Morning walk', streak: 0 },
];

const count = db.prepare('SELECT COUNT(*) AS n FROM habits').get().n;
if (count === 0) {
  const insert = db.prepare('INSERT INTO habits (name, streak) VALUES (?, ?)');
  const seedAll = db.transaction((rows) => {
    for (const row of rows) insert.run(row.name, row.streak);
  });
  seedAll(seed);
}

const listStmt = db.prepare(
  'SELECT id, name, streak, created_at FROM habits ORDER BY id ASC'
);
const insertStmt = db.prepare('INSERT INTO habits (name, streak) VALUES (?, 0)');
const pingStmt = db.prepare('SELECT 1 AS ok');

function listHabits() {
  return listStmt.all();
}

function addHabit(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const info = insertStmt.run(clean);
  return info.lastInsertRowid;
}

function ping() {
  return pingStmt.get().ok === 1;
}

module.exports = { db, listHabits, addHabit, ping };
