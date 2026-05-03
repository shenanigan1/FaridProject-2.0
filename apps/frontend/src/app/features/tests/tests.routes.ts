export const TESTS_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tests-admin.page').then((m) => m.TestsAdminPage),
  },
  {
    path: 'relaunch/:candidateId',
    loadComponent: () =>
      import('./pages/relaunch-test.page').then((m) => m.RelaunchTestPage),
  },
  {
    path: 'launch/:applicationId/:templateId',
    loadComponent: () =>
      import('./pages/launch-evaluation.page').then((m) => m.LaunchEvaluationPage),
  },
  {
    path: 'in-progress',
    loadComponent: () =>
      import('./pages/tests-in-progress.page').then((m) => m.TestsInProgressPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/test-assessment.page').then((m) => m.TestAssessmentPage),
  },
];
