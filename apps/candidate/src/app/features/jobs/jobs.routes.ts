// features/jobs/jobs.routes.ts
import { Routes } from '@angular/router';
import { JobListPageComponent } from './pages/job-list-page/job-list.page';
import { JobOfferDetailPageComponent } from './pages/job-offer-detail-page/job-offer-detail.page';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    component: JobListPageComponent,
  },
  {
    path: ':id',
    component: JobOfferDetailPageComponent,
  },
];
