import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  { path: '',
    loadComponent: () => import('src/app/features/test-templates/pages/test-templates-list.page')
      .then(m => m.TemplatesListComponent),
  },

  //Create/Edit restricted to HR/DIRECTOR/ADMIN (adjust if needed)
  {
    path: 'new',
    loadComponent: () => import('src/app/features/test-templates/pages/test-templates-create.page')
      .then(m => m.TemplatesEvalCreatePage),
  },

  {
  path: ':id',
  loadComponent: () =>
    import('src/app/features/test-templates/pages/test-templates-edit.page')
      .then(m => m.TemplatesEvalEditPage),
  }
];


