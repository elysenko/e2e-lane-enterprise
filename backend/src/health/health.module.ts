import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [HabitsModule],
  controllers: [HealthController],
})
export class HealthModule {}
