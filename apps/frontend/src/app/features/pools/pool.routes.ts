import { Routes } from '@angular/router';

export const POOLS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@pages/pools/pools-list.page')
        .then(m => m.PoolsListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('@pages/pools/new/pool-create.page')
        .then(m => m.PoolCreatePageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@pages/pools/[id]/pool-edit.page')
        .then(m => m.PoolEditPageComponent),
  },
];
