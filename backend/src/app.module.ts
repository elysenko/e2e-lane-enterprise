import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { HabitsModule } from './habits/habits.module';

/**
 * Root module.
 *
 * The API surface is deliberately minimal — the spec mandates no
 * authentication and no accounts surface, so there is no UsersModule,
 * no auth module and no guards. Everything under `/api` is public:
 *
 *   HealthModule  -> GET /api/health, GET /api/health/deep
 *   HabitsModule  -> GET /api/habits, POST /api/habits
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    HabitsModule,
  ],
})
export class AppModule {}
