export const POSITIONS_ROUTES = [
  {
    path: '',
    loadComponent: () => import('./pages/positions-list.page').then((m) => m.PositionsListPage),
  },

  {
    path: 'new',
    loadComponent: () => import('./pages/position-editor.page').then((m) => m.PositionEditorPage),
  },

  {
    path: ':id/applicants',
    loadComponent: () =>
      import('./pages/position-applicants.page').then((m) => m.PositionApplicantsPage),
  },

  {
    path: ':id',
    loadComponent: () => import('./pages/position-editor.page').then((m) => m.PositionEditorPage),
  },
];
