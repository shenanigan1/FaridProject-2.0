import { Routes } from '@angular/router';
import { JobListPageComponent } from './pages/job-list-page/job-list.page';
import { JobDetailPageComponent } from './pages/job-detail-page/job-detail.page';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    component: JobListPageComponent,
  },
  {
    path: ':id',
    component: JobDetailPageComponent,
  },
];
