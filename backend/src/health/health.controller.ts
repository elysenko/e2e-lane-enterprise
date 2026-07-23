import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HabitsService } from '../habits/habits.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly habits: HabitsService) {}

  /**
   * Liveness probe. Returns the exact `{ status: 'ok' }` shape the deploy
   * pipeline smoke-test expects — no dependency checks, always cheap.
   */
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Readiness / deep probe. Runs a trivial `SELECT 1` via HabitsService.ping()
   * to confirm database connectivity. Returns `{ status: 'ok', db: 'ok' }` on
   * success or a 503 (ServiceUnavailable) when the database is unreachable.
   */
  @Get('deep')
  async deep(): Promise<{ status: string; db: string }> {
    try {
      await this.habits.ping();
      return { status: 'ok', db: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
