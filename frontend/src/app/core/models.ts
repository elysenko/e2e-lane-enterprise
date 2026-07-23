/**
 * Wire shape of a habit as returned by the NestJS backend
 * (GET /api/habits). The backend serializes Prisma's `createdAt` to the
 * snake_case `created_at` field — keep these in sync.
 */
export interface Habit {
  id: string;
  name: string;
  streak: number;
  created_at: string;
}
