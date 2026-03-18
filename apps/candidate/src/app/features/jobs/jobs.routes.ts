// features/jobs/jobs.routes.ts
import { Routes } from '@angular/router';
import { JobListPageComponent } from './pages/job-list-page/job-list-page.component';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    component: JobListPageComponent,
  },
];
