import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'jobs',
  },
  {
    path: 'jobs',
    loadChildren: () =>
      import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES),
  },
  {
    path: 'tests',
    loadChildren: () =>
      import('./features/evaluations/evaluations.routes').then((m) => m.EVALUATIONS_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'jobs',
  },
];
