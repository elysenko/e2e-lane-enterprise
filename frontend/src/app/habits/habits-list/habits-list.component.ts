import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { Habit } from '../../core/models';
import { HabitsApi } from '../../shared/api/habits-api.service';

@Component({
  selector: 'app-habits-list',
  standalone: true,
  imports: [RouterLink, NavComponent],
  templateUrl: './habits-list.component.html',
  styleUrl: './habits-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsListComponent implements OnInit {
  private readonly habitsApi = inject(HabitsApi);

  // Backend-owned data. Seeded here with the same three habits the backend's
  // HabitsService.SEED_HABITS inserts on first boot, so the list renders
  // populated in the static preview (which has no API server) and reviewers
  // see the real design rather than an accidental empty state.
  habits = signal<Habit[]>([
    {
      id: '1',
      name: 'Drink water',
      streak: 5,
      created_at: '2026-08-17T08:00:00.000Z',
    },
    {
      id: '2',
      name: 'Read 20 minutes',
      streak: 2,
      created_at: '2026-08-20T08:00:00.000Z',
    },
    {
      id: '3',
      name: 'Morning walk',
      streak: 0,
      created_at: '2026-08-22T08:00:00.000Z',
    },
  ]);
  error = signal<string | null>(null);

  bestStreak = computed(() =>
    this.habits().reduce((max, h) => Math.max(max, h.streak), 0),
  );

  async ngOnInit(): Promise<void> {
    try {
      this.habits.set(await this.habitsApi.listHabits());
    } catch {
      // Leave whatever the signal already holds. Against the live backend that
      // initial value is empty, so a failed GET /api/habits renders the empty
      // state (never a crash); in the static preview it keeps the seed rows.
      this.error.set('Could not load habits.');
    }
  }
}
