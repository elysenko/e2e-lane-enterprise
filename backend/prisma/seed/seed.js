'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Uses @prisma/client (generated into node_modules at build time via `npx prisma generate`).
 *
 * Usage:  node prisma/seed/seed.js
 * Called by: npx prisma db seed  (via package.json "prisma.seed" field)
 *
 * Seeds the three example habits so `/habits` is never empty on a fresh
 * database. There are no user/credential seeds: the spec mandates no
 * authentication, so the app exposes no accounts surface to seed.
 *
 * Idempotent: rows are inserted only when the table is empty, so re-running
 * the seed — or running it alongside HabitsService.onModuleInit, which is the
 * primary seed path on every boot — never duplicates rows.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Mirrors SEED_HABITS in backend/src/habits/habits.service.ts — keep in sync. */
const SEED_HABITS = [
  { name: 'Drink water', streak: 5 },
  { name: 'Read 20 minutes', streak: 2 },
  { name: 'Morning walk', streak: 0 },
];

async function main() {
  const count = await prisma.habit.count();
  if (count > 0) {
    console.log(`Seed skipped: ${count} habit(s) already present`);
    return;
  }
  await prisma.habit.createMany({ data: SEED_HABITS });
  console.log(`Seeded ${SEED_HABITS.length} example habits`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
