'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Uses @prisma/client (generated into node_modules at build time via `npx prisma generate`).
 *
 * Usage:  node prisma/seed/seed.js
 * Called by: npx prisma db seed  (via package.json "prisma.seed" field)
 *
 * The app has NO authentication (per spec) — there are no users or credentials
 * to seed. Instead this seeds the three example habits so `/habits` is never
 * empty. It is idempotent: it only inserts when the table is empty (the running
 * backend also self-seeds via HabitsService.onModuleInit).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEED_HABITS = [
  { name: 'Drink water', streak: 5 },
  { name: 'Read 20 minutes', streak: 2 },
  { name: 'Morning walk', streak: 0 },
];

async function main() {
  const count = await prisma.habit.count();
  if (count > 0) {
    console.log(`Habits already present (${count}); skipping seed.`);
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
