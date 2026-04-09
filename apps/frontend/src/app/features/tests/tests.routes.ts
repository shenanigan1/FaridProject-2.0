export const TESTS_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tests-in-progress.page').then((m) => m.TestsInProgressPage),
  },
];
