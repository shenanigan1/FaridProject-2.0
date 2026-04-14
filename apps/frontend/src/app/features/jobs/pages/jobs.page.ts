import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PositionsListPage } from '@features/positions/pages/positions-list.page';

interface Shortcut {
  label: string;
  route: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-jobs-page',
  imports: [CommonModule, RouterLink, PositionsListPage],
  templateUrl: './jobs.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsPage {
  readonly shortcuts: Shortcut[] = [
    {
      label: 'Openings board',
      route: '/positions',
      description: 'Review all active positions and keep postings aligned with hiring needs.',
    },
    {
      label: 'Applicants workflow',
      route: '/positions',
      description: 'Open applicant pipelines to launch evaluations or reject applications.',
    },
    {
      label: 'Tests in progress',
      route: '/tests',
      description: 'Track launched questionnaires and continue manager scoring tasks.',
    },
  ];
}
