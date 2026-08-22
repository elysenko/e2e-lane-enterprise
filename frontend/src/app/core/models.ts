/**
 * The app's only domain entity. Mirrors backend/src/habits/habit.entity.ts —
 * the NestJS layer serializes Prisma's `createdAt` to snake_case `created_at`.
 *
 * `streak` is a static stored integer: the spec defines no check-in flow, so it
 * is set at creation (0) or by the seed and never updated from the UI.
 *
 * There are no User / role / service-settings models: the spec mandates no
 * authentication and no admin surface, so nothing consumes them.
 */
export interface Habit {
  id: string;
  name: string;
  streak: number;
  created_at: string;
}
