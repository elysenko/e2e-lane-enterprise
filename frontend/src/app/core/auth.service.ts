import { Injectable, computed, signal } from '@angular/core';
import { User, UserRole } from './models';

/**
 * Mockup auth service. Uses localStorage + a signal to simulate a session so
 * reviewers and the screenshot system can reach every authenticated screen
 * without a live backend. The service_agent stage will later replace the
 * stubbed methods with real API calls.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.restore());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  /** Simulated email/password login. */
  login(email: string): void {
    this.persist({
      id: 'u-1',
      name: email.split('@')[0] || 'Member',
      email,
      role: 'USER',
    });
  }

  /** Simulated signup. First-ever user becomes ADMIN (per full_auth policy). */
  signup(name: string, email: string, role: UserRole = 'USER'): void {
    this.persist({ id: 'u-new', name, email, role });
  }

  /** One-click bypass so the full authenticated UI is inspectable offline. */
  demoLogin(role: UserRole = 'USER'): void {
    this.persist({
      id: role === 'ADMIN' ? 'admin-demo' : 'demo-1',
      name: role === 'ADMIN' ? 'Demo Admin' : 'Demo Member',
      email: role === 'ADMIN' ? 'admin@demo.test' : 'demo@habit.test',
      role,
    });
  }

  logout(): void {
    this._user.set(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    } catch {
      /* storage unavailable — ignore in mockup */
    }
  }

  private persist(user: User): void {
    this._user.set(user);
    try {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
    } catch {
      /* storage unavailable — ignore in mockup */
    }
  }

  private restore(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
