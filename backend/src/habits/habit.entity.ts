import { ApiProperty } from '@nestjs/swagger';

/**
 * Wire shape returned to the Angular client.
 *
 * The frontend `Habit` model (frontend/src/app/core/models.ts) uses the
 * snake_case field `created_at`, so the service serializes Prisma's
 * `createdAt` to `created_at` here. Keep these in sync.
 */
export class HabitResponse {
  @ApiProperty({ example: 'clx123abc' })
  id!: string;

  @ApiProperty({ example: 'Drink water' })
  name!: string;

  @ApiProperty({ example: 5 })
  streak!: number;

  @ApiProperty({ example: '2026-07-22T10:00:00.000Z' })
  created_at!: string;
}
