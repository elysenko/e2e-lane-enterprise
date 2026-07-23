import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitResponse } from './habit.entity';

/**
 * REST API for habits. Public (the app has no authentication, per spec).
 *
 * Consumed by the Angular client:
 *   GET  /habits  -> list (listHabits)
 *   POST /habits  -> create { name }
 */
@ApiTags('habits')
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all habits, newest first' })
  findAll(): Promise<HabitResponse[]> {
    return this.habitsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a habit' })
  create(@Body() dto: CreateHabitDto): Promise<HabitResponse> {
    const name = typeof dto?.name === 'string' ? dto.name.trim() : '';
    if (!name) {
      throw new BadRequestException('Habit name is required.');
    }
    return this.habitsService.create(name);
  }
}
