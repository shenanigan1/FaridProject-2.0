import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guard/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
  },

  {
    path: 'candidates',
    loadChildren: () =>
      import('./features/candidates/candidates.routes').then((m) => m.CANDIDATES_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'positions',
    loadChildren: () => import('./features/positions/positions.routes').then((m) => m.POSITIONS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'pools',
    loadChildren: () => import('src/app/features/pools/pool.routes').then((m) => m.POOLS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'templates',
    loadChildren: () =>
      import('src/app/features/test-templates/test-templates.routes').then((m) => m.TEMPLATES_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },
  {
    path: 'tests',
    loadChildren: () =>
      import('src/app/features/tests/tests.routes').then((m) => m.TESTS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
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
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./features/contact/pages/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'contact/:id',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./features/contact/pages/contact-detail.page').then((m) => m.ContactDetailPage),
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
    loadComponent: () =>
      import('./features/jobs/pages/jobs.page').then((m) => m.JobsPage),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/profile/pages/profile.page').then((m) => m.ProfilePage),
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
