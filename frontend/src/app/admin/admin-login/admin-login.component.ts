import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);

  submit(): void {
    if (!this.email().trim() || !this.password().trim()) {
      this.error.set('Enter admin credentials to continue.');
      return;
    }
    this.error.set(null);
    this.auth.signup(this.email().split('@')[0] || 'Admin', this.email().trim(), 'ADMIN');
    this.router.navigate(['/admin/settings']);
  }

  demo(): void {
    this.auth.demoLogin('ADMIN');
    this.router.navigate(['/admin/settings']);
  }
}
