export const TESTS_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tests-admin.page').then((m) => m.TestsAdminPage),
  },
  {
    path: 'in-progress',
    loadComponent: () =>
      import('./pages/tests-in-progress.page').then((m) => m.TestsInProgressPage),
  },
];
