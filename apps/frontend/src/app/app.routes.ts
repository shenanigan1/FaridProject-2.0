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
  path: 'positions',
  loadChildren: () =>
    import('./features/positions/positions.routes')
      .then(m => m.POSITIONS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'pools',
    loadChildren: () =>
      import('src/app/features/pools/pool.routes')
        .then(m => m.POOLS_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  {
    path: 'templates',
    loadChildren: ()=>
      import('src/app/features/test-templates/test-templates.routes')
        .then(m => m.TEMPLATES_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['hr', 'admin', 'director', 'manager'] },
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
