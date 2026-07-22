import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { Habit } from '../../core/models';

@Component({
  selector: 'app-habits-list',
  standalone: true,
  imports: [RouterLink, NavComponent],
  templateUrl: './habits-list.component.html',
  styleUrl: './habits-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitsListComponent {
  // Seed data mirrors the backend's seed-on-start rows. Declared as a
  // signal<Habit[]> so mockup_cleaner can empty it and service_agent can
  // wire it to listHabits() via the API.
  habits = signal<Habit[]>([
    { id: '1', name: 'Drink water', streak: 5, created_at: '2026-07-20' },
    { id: '2', name: 'Read 20 minutes', streak: 2, created_at: '2026-07-21' },
    { id: '3', name: 'Morning walk', streak: 0, created_at: '2026-07-22' },
  ]);

  bestStreak = computed(() =>
    this.habits().reduce((max, h) => Math.max(max, h.streak), 0),
  );
}
