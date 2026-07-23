import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { HabitsApi } from '../../shared/api/habits-api.service';

@Component({
  selector: 'app-habit-new',
  standalone: true,
  imports: [FormsModule, RouterLink, NavComponent],
  templateUrl: './habit-new.component.html',
  styleUrl: './habit-new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitNewComponent {
  private readonly router = inject(Router);
  private readonly habitsApi = inject(HabitsApi);

  name = signal('');
  error = signal<string | null>(null);
  submitting = signal(false);

  async create(): Promise<void> {
    const name = this.name().trim();
    if (!name) {
      this.error.set('Please enter a habit name.');
      return;
    }
    if (this.submitting()) {
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    try {
      // POST /api/habits, then navigate back to the list which reloads live.
      await this.habitsApi.addHabit(name);
      this.router.navigate(['/habits']);
    } catch {
      this.error.set('Could not create habit. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
