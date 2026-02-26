import { Routes } from '@angular/router';

export const POOLS_ROUTES: Routes = [
    // Pools List
  {
    path: '',
    loadComponent: () =>
      import('src/app/features/pools/pages/pools-list.page')
        .then(m => m.PoolsListPageComponent),
  },
    // Create Pool
  {
    path: 'new',
    loadComponent: () =>
      import('src/app/features/pools/pages/pool-create.page')
        .then(m => m.PoolCreatePageComponent),
  },
   // Edit Pool(Questions View)
  {
    path: ':id',
    loadComponent: () =>
      import('src/app/features/pools/pages/pool-edit.page')
        .then(m => m.PoolEditPageComponent),
  },
   // Create Question
  {
    path: ':poolId/questions/new',
    loadComponent: () =>
      import('src/app/features/questions/pages/question-create.page').then(m => m.QuestionCreatePageComponent),
  },
  // Edit Question
  {
    path: ':poolId/questions/:questionId',
    loadComponent: () =>
      import('src/app/features/questions/pages/question-edit.page').then(m => m.QuestionEditPageComponent),
  },
];
