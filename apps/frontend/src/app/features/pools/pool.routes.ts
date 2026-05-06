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
      import('src/app/features/pools/pages/pool-editor.page')
        .then(m => m.PoolEditorPageComponent),
  },
   // Edit Pool(Questions View)
  {
    path: ':id',
    loadComponent: () =>
      import('src/app/features/pools/pages/pool-editor.page')
        .then(m => m.PoolEditorPageComponent),
  },
   // Create Question
  {
    path: ':poolId/questions/new',
    loadComponent: () =>
      import('src/app/features/questions/pages/question-editor.page').then(m => m.QuestionEditorPageComponent),
  },
  // Edit Question
  {
    path: ':poolId/questions/:questionId',
    loadComponent: () =>
      import('src/app/features/questions/pages/question-editor.page').then(m => m.QuestionEditorPageComponent),
  },
];
