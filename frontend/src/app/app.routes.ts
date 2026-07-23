import { Routes } from '@angular/router';

export const routes: Routes = [
  // No authentication (per spec): the root URL lands directly on the habit list.
  { path: '', pathMatch: 'full', redirectTo: 'habits' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'habits',
    loadComponent: () =>
      import('./habits/habits-list/habits-list.component').then(
        (m) => m.HabitsListComponent,
      ),
  },
  {
    path: 'habits/new',
    loadComponent: () =>
      import('./habits/habit-new/habit-new.component').then(
        (m) => m.HabitNewComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin/settings',
    loadComponent: () =>
      import('./admin/admin-settings/admin-settings.component').then(
        (m) => m.AdminSettingsComponent,
      ),
  },
  { path: '**', redirectTo: 'habits' },
];
