import { Routes } from '@angular/router';

import { CandidatesListPage } from './pages/candidates-list.page';

export const CANDIDATES_ROUTES: Routes = [
  {
    path: '',
    component: CandidatesListPage,
  },
];
