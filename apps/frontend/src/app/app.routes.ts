import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guard/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },

  {
  path: 'positions',
  loadComponent: () =>
    import('./pages/positions/positions-list.page')
      .then(m => m.PositionsListPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'positions/new',
    loadComponent: () =>
      import('./pages/positions/new/position-create.page')
        .then(m => m.PositionCreatePage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director'] },
  },

  {
    path: 'pools',
    loadChildren: () =>
      import('@features/pools/pool.routes')
        .then(m => m.POOLS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
