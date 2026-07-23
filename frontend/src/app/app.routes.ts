import { Routes } from '@angular/router';

// No authentication (per spec): every route is public and there is no
// login / signup / admin surface. Each app state has its own URL so it is
// deep-linkable (habit list, add-habit form, about page).
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'habits' },
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
  { path: '**', redirectTo: 'habits' },
];
