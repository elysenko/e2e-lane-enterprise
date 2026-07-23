import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: string } {
    return { status: 'ok' };
  }

  @Get('deep')
  async deep(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch (error) {
      throw new HttpException(
        { status: 'error', db: 'down', message: String(error) },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
