import { Routes } from '@angular/router';

import { MyTestsPageComponent } from './pages/my-tests-page/my-tests.page';
import { TakeTestPageComponent } from './pages/take-test-page/take-test.page';

export const EVALUATIONS_ROUTES: Routes = [
  {
    path: '',
    component: MyTestsPageComponent,
  },
  {
    path: ':id',
    component: TakeTestPageComponent,
  },
];
