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

  /**
   * Live, backend-owned data — never placeholder rows.
   *
   * The list starts EMPTY and is filled only by `GET /api/habits`. It must not
   * be pre-seeded with example habits: fabricated rows would render as if the
   * API had answered, so a broken backend (bad DATABASE_URL, crash-looping
   * pod, 502 from nginx) would look identical to a healthy one and the deploy
   * gate would pass on a dead app. The three example habits a visitor sees on
   * a fresh deploy come from the real database via
   * HabitsService.onModuleInit's seed, not from here.
   */
  habits = signal<Habit[]>([]);

  /** True while GET /api/habits is in flight — drives the loading state. */
  loading = signal(true);

  /** Set when the request fails, so the UI can say so instead of lying "no habits yet". */
  error = signal<string | null>(null);

  bestStreak = computed(() =>
    this.habits().reduce((max, h) => Math.max(max, h.streak), 0),
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  /** Fetch the live list; also the retry handler for the error state. */
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.habits.set(await this.habitsApi.listHabits());
    } catch {
      // Distinct from "no habits yet": the request failed, so we know nothing
      // about the real list. Show the failure (with a retry) rather than an
      // empty state that would misreport an outage as "you have no habits".
      this.habits.set([]);
      this.error.set('Could not load your habits. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
