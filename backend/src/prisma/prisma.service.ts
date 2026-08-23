import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Connect eagerly so a healthy database is ready before the first request,
   * but treat a failure as NON-FATAL.
   *
   * Rationale: `DATABASE_URL` is injected from the `app-secrets` secretRef with
   * `optional: true` (k8s/deployment.yaml), and Postgres may still be starting
   * when this pod boots. Letting `$connect()` reject here would abort Nest's
   * bootstrap and kill the process, so supervisord/K8s would crash-loop the
   * container and `/api/health` could never answer — the liveness probe would
   * fail and the deep probe could never report the 503 that tells an operator
   * the DB is the problem.
   *
   * Prisma connects lazily on the next query, so once the database comes back
   * the app recovers on its own with no process restart: `/api/health/deep`
   * flips from 503 back to 200. A DB outage degrades the app instead of
   * taking the whole pod down.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error(
        `Database unavailable at startup — continuing without it; ` +
          `queries will retry lazily and /api/health/deep will report 503 ` +
          `until it recovers. Cause: ${String(error)}`,
      );
    }
  }

  /** Release the connection pool cleanly on shutdown. */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {
      // Already disconnected or never connected — nothing to clean up.
    }
  }

  enableShutdownHooks(app: INestApplication): void {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
