import { Routes } from '@angular/router';

export const POOLS_ROUTES: Routes = [
    // Pools List
  {
    path: '',
    loadComponent: () =>
      import('@pages/pools/pools-list.page')
        .then(m => m.PoolsListPageComponent),
  },
    // Create Pool
  {
    path: 'new',
    loadComponent: () =>
      import('@pages/pools/new/pool-create.page')
        .then(m => m.PoolCreatePageComponent),
  },
   // Edit Pool(Questions View)
  {
    path: ':id',
    loadComponent: () =>
      import('@pages/pools/[id]/pool-edit.page')
        .then(m => m.PoolEditPageComponent),
  },
   // Create Question
  {
    path: ':poolId/questions/new',
    loadComponent: () =>
      import('@pages/pools/[id]/questions/new/question-create.page').then(m => m.QuestionCreatePageComponent),
  },
  // Edit Question
  {
    path: ':poolId/questions/:questionId',
    loadComponent: () =>
      import('@pages/pools/[id]/questions/[id]/question-edit.page').then(m => m.QuestionEditPageComponent),
  },
];
