import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guard/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/shared/pages/work-in-progress.page').then((m) => m.WorkInProgressPage),
    data: {
      title: 'Forgot Password',
      description: 'Password recovery flow is planned for a future increment.',
      errorCode: 'AUTH-404',
      errorMessage: 'Forgot password page is not implemented yet.',
    },
  },
  {
    path: 'request-access',
    loadComponent: () =>
      import('./features/shared/pages/work-in-progress.page').then((m) => m.WorkInProgressPage),
    data: {
      title: 'Request Access',
      description: 'Access request onboarding is planned for a future increment.',
      errorCode: 'AUTH-405',
      errorMessage: 'Request access page is not implemented yet.',
    },
  },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
  },

  {
    path: 'manager',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./features/manager/pages/manager-home.page').then((m) => m.ManagerHomePage),
  },
  {
    path: 'manager/tests',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./features/manager/pages/manager-tests.page').then((m) => m.ManagerTestsPage),
  },
  {
    path: 'manager/tests/:id',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./features/manager/pages/manager-test-detail.page').then(
        (m) => m.ManagerTestDetailPage,
      ),
  },

  {
    path: 'candidates',
    loadChildren: () =>
      import('./features/candidates/candidates.routes').then((m) => m.CANDIDATES_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },

  {
    path: 'positions',
    loadChildren: () =>
      import('./features/positions/positions.routes').then((m) => m.POSITIONS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },

  {
    path: 'pools',
    loadChildren: () => import('src/app/features/pools/pool.routes').then((m) => m.POOLS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },

  {
    path: 'templates',
    loadChildren: () =>
      import('src/app/features/test-templates/test-templates.routes').then(
        (m) => m.TEMPLATES_ROUTES,
    ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },
  {
    path: 'tests',
    loadChildren: () => import('src/app/features/tests/tests.routes').then((m) => m.TESTS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./features/roles/pages/roles-admin.page').then((m) => m.RolesAdminPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'contact',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
    loadComponent: () => import('./features/contact/pages/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'contact/:id',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
    loadComponent: () =>
      import('./features/contact/pages/contact-detail.page').then((m) => m.ContactDetailPage),
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
    loadComponent: () => import('./features/jobs/pages/jobs.page').then((m) => m.JobsPage),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/profile/pages/profile.page').then((m) => m.ProfilePage),
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
