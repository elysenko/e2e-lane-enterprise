import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { HabitsModule } from './habits/habits.module';

// No authentication (per spec): no users, roles, or auth module. The app
// exposes only the public habits resource plus a health check.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    HabitsModule,
  ],
})
export class AppModule {}
