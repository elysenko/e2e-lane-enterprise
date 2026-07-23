import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Habit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HabitResponse } from './habit.entity';

/**
 * Seed rows inserted on first start so `/habits` is never empty.
 * Mirrors the frontend mockup's placeholder rows
 * (frontend/src/app/habits/habits-list/habits-list.component.ts).
 */
const SEED_HABITS: Array<{ name: string; streak: number }> = [
  { name: 'Drink water', streak: 5 },
  { name: 'Read 20 minutes', streak: 2 },
  { name: 'Morning walk', streak: 0 },
];

@Injectable()
export class HabitsService implements OnModuleInit {
  private readonly logger = new Logger(HabitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Seed-on-start: guarantees the list view has content after a fresh deploy. */
  async onModuleInit(): Promise<void> {
    try {
      const count = await this.prisma.habit.count();
      if (count === 0) {
        await this.prisma.habit.createMany({ data: SEED_HABITS });
        this.logger.log(`Seeded ${SEED_HABITS.length} example habits`);
      }
    } catch (error) {
      // Non-fatal: app still boots even if seeding fails (e.g. table not yet migrated).
      this.logger.warn(`Habit seeding skipped: ${String(error)}`);
    }
  }

  async findAll(): Promise<HabitResponse[]> {
    const habits = await this.prisma.habit.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return habits.map((h) => this.toResponse(h));
  }

  async create(name: string): Promise<HabitResponse> {
    const habit = await this.prisma.habit.create({
      data: { name: name.trim() },
    });
    return this.toResponse(habit);
  }

  /** Trivial connectivity probe used by the deep health check. */
  async ping(): Promise<boolean> {
    await this.prisma.$queryRaw`SELECT 1`;
    return true;
  }

  private toResponse(habit: Habit): HabitResponse {
    return {
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      created_at: habit.createdAt.toISOString(),
    };
  }
}
