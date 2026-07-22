import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);

  submit(): void {
    if (!this.email().trim() || !this.password().trim()) {
      this.error.set('Enter your email and password to continue.');
      return;
    }
    this.error.set(null);
    this.auth.login(this.email().trim());
    this.router.navigate(['/habits']);
  }

  demo(): void {
    this.auth.demoLogin('USER');
    this.router.navigate(['/habits']);
  }
}
