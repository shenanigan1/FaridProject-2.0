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
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/candidate-dashboard.page').then(
        (m) => m.CandidateDashboardPage,
      ),
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./features/applications/candidate-applications.page').then(
        (m) => m.CandidateApplicationsPage,
      ),
  },
  {
    path: 'tests',
    loadComponent: () =>
      import('./features/tests/candidate-tests.page').then((m) => m.CandidateTestsPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/candidate-profile.page').then((m) => m.CandidateProfilePage),
  },
  {
    path: '**',
    redirectTo: 'jobs',
  },
];
