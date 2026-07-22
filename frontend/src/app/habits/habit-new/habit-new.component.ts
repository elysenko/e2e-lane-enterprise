import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';

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

  name = signal('');
  error = signal<string | null>(null);

  create(): void {
    if (!this.name().trim()) {
      this.error.set('Please enter a habit name.');
      return;
    }
    this.error.set(null);
    // In the mockup, creation navigates back to the list. The backend POST
    // /habits handler + redirect is wired by the service_agent stage.
    this.router.navigate(['/habits']);
  }
}
