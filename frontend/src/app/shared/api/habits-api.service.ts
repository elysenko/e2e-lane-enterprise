import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Habit } from '../../core/models';
import { API_BASE } from './api.config';

/**
 * REST client for the habits resource, backed by the NestJS HabitsController:
 *   GET  /api/habits   -> Habit[]        (listHabits)
 *   POST /api/habits   -> Habit          (addHabit, body { name })
 *
 * The backend serializes Prisma's `createdAt` to the snake_case `created_at`
 * field (see backend habit.entity.ts), matching the frontend `Habit` model.
 */
@Injectable({ providedIn: 'root' })
export class HabitsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/habits`;

  /** List all habits, newest first. */
  listHabits(): Promise<Habit[]> {
    return firstValueFrom(this.http.get<Habit[]>(this.base));
  }

  /** Create a habit from a name; streak starts at 0 server-side. */
  addHabit(name: string): Promise<Habit> {
    return firstValueFrom(this.http.post<Habit>(this.base, { name }));
  }
}
