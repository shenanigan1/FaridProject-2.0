// templates.routes.ts
import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/test-templates-list.page').then(m => m.TemplatesListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/test-templates-editor.page').then(m => m.TestTemplateEditorPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/test-templates-editor.page').then(m => m.TestTemplateEditorPage),
  },
];
