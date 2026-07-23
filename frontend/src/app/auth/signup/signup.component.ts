import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  confirm = signal('');
  error = signal<string | null>(null);

  submit(): void {
    if (!this.name().trim() || !this.email().trim() || !this.password().trim()) {
      this.error.set('Please fill in every field.');
      return;
    }
    if (this.password() !== this.confirm()) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.error.set(null);
    // First user created via signup receives ADMIN in the real backend.
    this.auth.signup(this.name().trim(), this.email().trim(), 'USER');
    this.router.navigate(['/habits']);
  }
}
