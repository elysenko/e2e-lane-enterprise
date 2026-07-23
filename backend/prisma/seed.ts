import { PrismaClient } from '@prisma/client';

/**
 * Dev seed (TypeScript). The production seed is prisma/seed/seed.js (plain node).
 *
 * The app has NO authentication (per spec) — no users or credentials. This
 * seeds the three example habits so `/habits` is never empty. Idempotent: it
 * only inserts when the habits table is empty.
 */
const prisma = new PrismaClient();

const SEED_HABITS: Array<{ name: string; streak: number }> = [
  { name: 'Drink water', streak: 5 },
  { name: 'Read 20 minutes', streak: 2 },
  { name: 'Morning walk', streak: 0 },
];

async function main(): Promise<void> {
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
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
