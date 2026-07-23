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

  // Populated from GET /api/habits on init. Starts empty (the template shows an
  // empty state); the backend seeds three example habits on first start so the
  // live list is never blank after a fresh deploy.
  habits = signal<Habit[]>([]);
  error = signal<string | null>(null);

  bestStreak = computed(() =>
    this.habits().reduce((max, h) => Math.max(max, h.streak), 0),
  );

  async ngOnInit(): Promise<void> {
    try {
      this.habits.set(await this.habitsApi.listHabits());
    } catch {
      this.error.set('Could not load habits.');
      this.habits.set([]);
    }
  }
}
