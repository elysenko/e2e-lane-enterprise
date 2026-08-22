import { Routes } from '@angular/router';

/**
 * Every route is public and deep-linkable — the spec mandates no authentication,
 * so there are no /login, /signup or /admin/* routes and no guards. Those paths
 * fall through the `**` wildcard to the habit list.
 *
 * `data.flow` names the user journey each route serves so the surface contract
 * and the acceptance gates can address every screen by URL.
 */
export const routes: Routes = [
  // The root URL lands directly on the habit list.
  { path: '', pathMatch: 'full', redirectTo: 'habits' },
  {
    path: 'habits',
    data: { flow: 'habits-list' },
    loadComponent: () =>
      import('./habits/habits-list/habits-list.component').then(
        (m) => m.HabitsListComponent,
      ),
  },
  {
    path: 'habits/new',
    data: { flow: 'habit-create' },
    loadComponent: () =>
      import('./habits/habit-new/habit-new.component').then(
        (m) => m.HabitNewComponent,
      ),
  },
  {
    path: 'about',
    data: { flow: 'about' },
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
  },
  { path: '**', redirectTo: 'habits' },
];
