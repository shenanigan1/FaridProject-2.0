import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  { path: '',
    loadComponent: () => import('@pages/templates_eval/templates_eval-list.page')
      .then(m => m.TemplatesListComponent),
  },

  //Create/Edit restricted to HR/DIRECTOR/ADMIN (adjust if needed)
  {
    path: 'new',
    loadComponent: () => import('@pages/templates_eval/new/templates_eval-create.page')
      .then(m => m.TemplatesEvalCreatePage),
  },

  {
  path: ':id',
  loadComponent: () =>
    import('@pages/templates_eval/[id]/templates_eval-edit.page')
      .then(m => m.TemplatesEvalEditPage),
  }
];


